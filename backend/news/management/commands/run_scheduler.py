"""
DevPulse Automated Ingestion Scheduler.
Runs continuous or single-cycle scheduled ingestion with process locking,
exponential backoff, Daily Briefing synchronization, and graceful termination.
"""

import time
import signal
import sys
import logging
from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from news.models import Source, IngestionJob
from ingestion.engine import IngestionEngine
from news.services import generate_daily_briefing

logger = logging.getLogger('devpulse.scheduler')


class Command(BaseCommand):
    help = 'Runs the automated background ingestion scheduler'

    def add_arguments(self, parser):
        parser.add_argument(
            '--interval-seconds',
            type=int,
            default=60,
            help='Seconds to sleep between source evaluation cycles (default: 60s)'
        )
        parser.add_argument(
            '--once',
            action='store_true',
            help='Run a single evaluation cycle and exit immediately'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force poll all active sources ignoring backoff intervals'
        )

    def handle(self, *args, **options):
        interval = options['interval_seconds']
        run_once = options['once']
        force = options['force']

        self.running = True

        def signal_handler(signum, frame):
            self.stdout.write(self.style.WARNING("\nShutdown signal received. Finishing active jobs..."))
            self.running = False

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        self.stdout.write(self.style.SUCCESS(
            f"[*] DevPulse Ingestion Scheduler started (interval={interval}s, run_once={run_once}, force={force})"
        ))

        while self.running:
            cycle_start = timezone.now()
            self.stdout.write(f"\n--- [Cycle started at {cycle_start:%Y-%m-%d %H:%M:%S} UTC] ---")

            try:
                self.run_cycle(force=force)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error during scheduler cycle: {e}"))
                logger.exception("Scheduler cycle failure")

            if run_once:
                self.stdout.write(self.style.SUCCESS("Single cycle completed (--once flag active). Exiting."))
                break

            # Sleep in 1-second chunks to respond quickly to shutdown signals
            for _ in range(interval):
                if not self.running:
                    break
                time.sleep(1)

        self.stdout.write(self.style.SUCCESS("[*] Ingestion Scheduler cleanly stopped."))

    def run_cycle(self, force: bool = False):
        active_sources = Source.objects.filter(is_active=True)
        now = timezone.now()

        polled_count = 0
        total_created = 0
        total_updated = 0
        skipped_count = 0
        failed_count = 0

        for src in active_sources:
            if not self.running:
                break

            # Check if source is due
            is_due = force or self._is_source_due(src, now)
            if not is_due:
                skipped_count += 1
                continue

            self.stdout.write(f"-> Polling {src.name} ({src.slug})...")
            job = IngestionEngine.poll_source(src, force=force)
            polled_count += 1

            if job.status == 'success':
                total_created += job.items_created
                total_updated += job.items_updated
                self.stdout.write(self.style.SUCCESS(
                    f"   [OK] Found {job.items_found}, Created {job.items_created}, Updated {job.items_updated}"
                ))
            elif job.status == 'skipped':
                self.stdout.write(f"   [SKIPPED] {job.error_message or 'No modifications (304 Not Modified)'}")
            else:
                failed_count += 1
                self.stdout.write(self.style.ERROR(f"   [FAILED] {job.error_message}"))

        # Synchronize today's Daily Briefing if new articles arrived
        if total_created > 0:
            self.stdout.write("Refreshing executive Daily Briefing...")
            generate_daily_briefing()

        self.stdout.write(
            f"Cycle finished: {polled_count} polled, {total_created} new articles, "
            f"{skipped_count} skipped, {failed_count} failed."
        )

    def _is_source_due(self, source: Source, now: datetime) -> bool:
        if not source.last_polled_at:
            return True

        # Check backoff if failing
        if source.consecutive_failures > 0:
            backoff_mins = min(source.poll_interval_minutes * (2 ** min(source.consecutive_failures - 1, 6)), 1440)
            return now >= source.last_polled_at + timedelta(minutes=backoff_mins)

        # Standard polling interval
        return now >= source.last_polled_at + timedelta(minutes=source.poll_interval_minutes)
