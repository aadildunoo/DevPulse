"""
Management command to run the news ingestion engine.
"""

from django.core.management.base import BaseCommand
from news.models import Source
from ingestion.engine import IngestionEngine

class Command(BaseCommand):
    help = 'Executes news ingestion for active sources'

    def add_arguments(self, parser):
        parser.add_argument('--source', type=str, help='Specific source slug to poll')

    def handle(self, *args, **options):
        source_slug = options.get('source')
        if source_slug:
            try:
                src = Source.objects.get(slug=source_slug)
                self.stdout.write(f"Ingesting source: {src.name} ({src.url})...")
                job = IngestionEngine.poll_source(src)
                self.stdout.write(self.style.SUCCESS(
                    f"Completed [{job.status}]: Found {job.items_found}, Created {job.items_created}, Updated {job.items_updated}"
                ))
            except Source.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Source with slug '{source_slug}' not found."))
        else:
            self.stdout.write("Starting ingestion for all active sources...")
            jobs = IngestionEngine.poll_all_active_sources()
            total_created = sum(j.items_created for j in jobs)
            total_found = sum(j.items_found for j in jobs)
            self.stdout.write(self.style.SUCCESS(
                f"Ingestion finished across {len(jobs)} sources! Found {total_found} items, created {total_created} new articles with AI intelligence."
            ))
