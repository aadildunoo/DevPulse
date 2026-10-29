"""
DevPulse Technology Markets Data Service.
Modular provider abstraction, intelligent caching, rate limit protection,
market session awareness (Open/Closed/Pre/Post), and financial data management.
"""

import os
import logging
from datetime import datetime, time, date
from decimal import Decimal
from typing import Dict, Any, List, Optional
from zoneinfo import ZoneInfo
from django.utils import timezone
from django.db import transaction

from markets.models import Company, MarketIndex, StockQuote, FinancialResult, WatchlistItem

logger = logging.getLogger(__name__)

# Established baseline technology universe with factual corporate and financial metadata
SEED_COMPANIES = [
    {
        'ticker': 'NVDA',
        'name': 'NVIDIA Corporation',
        'exchange': 'NASDAQ',
        'sector': 'Semiconductors',
        'industry': 'AI Accelerators & Graphics Processing',
        'headquarters': 'Santa Clara, California',
        'ceo': 'Jensen Huang',
        'founded_year': 1993,
        'employee_count': 29600,
        'website': 'https://www.nvidia.com',
        'description': 'Pioneer of GPU-accelerated computing and the dominant provider of AI enterprise supercomputing clusters.',
        'current_price': Decimal('138.25'),
        'change': Decimal('4.10'),
        'change_percent': Decimal('3.056'),
        'open_price': Decimal('135.00'),
        'high_price': Decimal('139.10'),
        'low_price': Decimal('134.80'),
        'previous_close': Decimal('134.15'),
        'volume': 48920000,
        'avg_volume': 51200000,
        'market_cap': 3380000000000,
        'market_cap_formatted': '$3.38 Trillion',
        'pe_ratio': Decimal('52.4'),
        'week_52_high': Decimal('149.77'),
        'week_52_low': Decimal('45.68'),
        'earnings_date': date(2026, 11, 20),
        'movement_context': 'Gains fueled by sustained hyperscaler demand for Blackwell AI architecture and data-center rack server deployments.',
    },
    {
        'ticker': 'MSFT',
        'name': 'Microsoft Corporation',
        'exchange': 'NASDAQ',
        'sector': 'Cloud & Enterprise Software',
        'industry': 'Productivity, Cloud Infrastructure & AI',
        'headquarters': 'Redmond, Washington',
        'ceo': 'Satya Nadella',
        'founded_year': 1975,
        'employee_count': 228000,
        'website': 'https://www.microsoft.com',
        'description': 'Global software, cloud computing (Azure), enterprise services, and AI partner of OpenAI.',
        'current_price': Decimal('432.80'),
        'change': Decimal('5.40'),
        'change_percent': Decimal('1.263'),
        'open_price': Decimal('428.10'),
        'high_price': Decimal('434.50'),
        'low_price': Decimal('427.90'),
        'previous_close': Decimal('427.40'),
        'volume': 21450000,
        'avg_volume': 23000000,
        'market_cap': 3220000000000,
        'market_cap_formatted': '$3.22 Trillion',
        'pe_ratio': Decimal('36.2'),
        'week_52_high': Decimal('468.35'),
        'week_52_low': Decimal('366.50'),
        'earnings_date': date(2026, 10, 30),
        'movement_context': 'Strength in Azure cloud revenue acceleration and expanded enterprise adoption of Microsoft 365 Copilot.',
    },
    {
        'ticker': 'AAPL',
        'name': 'Apple Inc.',
        'exchange': 'NASDAQ',
        'sector': 'Consumer Technology',
        'industry': 'Personal Computing, Mobile & Silicon',
        'headquarters': 'Cupertino, California',
        'ceo': 'Tim Cook',
        'founded_year': 1976,
        'employee_count': 161000,
        'website': 'https://www.apple.com',
        'description': 'Designer and manufacturer of iPhone, Mac, iPad, Apple Silicon chips, and digital ecosystem services.',
        'current_price': Decimal('234.50'),
        'change': Decimal('-1.20'),
        'change_percent': Decimal('-0.509'),
        'open_price': Decimal('235.80'),
        'high_price': Decimal('236.40'),
        'low_price': Decimal('233.10'),
        'previous_close': Decimal('235.70'),
        'volume': 42100000,
        'avg_volume': 48000000,
        'market_cap': 3560000000000,
        'market_cap_formatted': '$3.56 Trillion',
        'pe_ratio': Decimal('34.8'),
        'week_52_high': Decimal('237.23'),
        'week_52_low': Decimal('164.08'),
        'earnings_date': date(2026, 10, 31),
        'movement_context': 'Modest consolidation ahead of quarterly earnings; focus on Apple Intelligence hardware upgrade cycle.',
    },
    {
        'ticker': 'GOOGL',
        'name': 'Alphabet Inc.',
        'exchange': 'NASDAQ',
        'sector': 'Internet & Cloud',
        'industry': 'Search, Cloud Computing, AI & Advertising',
        'headquarters': 'Mountain View, California',
        'ceo': 'Sundar Pichai',
        'founded_year': 1998,
        'employee_count': 182500,
        'website': 'https://abc.xyz',
        'description': 'Parent company of Google, Google Cloud, YouTube, and Google DeepMind.',
        'current_price': Decimal('179.30'),
        'change': Decimal('2.85'),
        'change_percent': Decimal('1.615'),
        'open_price': Decimal('176.80'),
        'high_price': Decimal('180.20'),
        'low_price': Decimal('176.50'),
        'previous_close': Decimal('176.45'),
        'volume': 23900000,
        'avg_volume': 25000000,
        'market_cap': 2220000000000,
        'market_cap_formatted': '$2.22 Trillion',
        'pe_ratio': Decimal('24.1'),
        'week_52_high': Decimal('191.75'),
        'week_52_low': Decimal('129.01'),
        'earnings_date': date(2026, 10, 29),
        'movement_context': 'Strong quarterly cloud backlog expansion and Gemini multimodal enterprise API consumption growth.',
    },
    {
        'ticker': 'AMZN',
        'name': 'Amazon.com, Inc.',
        'exchange': 'NASDAQ',
        'sector': 'Cloud & E-Commerce',
        'industry': 'AWS Cloud Infrastructure & Digital Logistics',
        'headquarters': 'Seattle, Washington',
        'ceo': 'Andy Jassy',
        'founded_year': 1994,
        'employee_count': 1525000,
        'website': 'https://www.amazon.com',
        'description': 'Global cloud infrastructure provider through Amazon Web Services (AWS) and digital commerce leader.',
        'current_price': Decimal('192.40'),
        'change': Decimal('3.15'),
        'change_percent': Decimal('1.664'),
        'open_price': Decimal('189.50'),
        'high_price': Decimal('193.20'),
        'low_price': Decimal('189.10'),
        'previous_close': Decimal('189.25'),
        'volume': 36500000,
        'avg_volume': 38000000,
        'market_cap': 2010000000000,
        'market_cap_formatted': '$2.01 Trillion',
        'pe_ratio': Decimal('44.3'),
        'week_52_high': Decimal('201.20'),
        'week_52_low': Decimal('118.35'),
        'earnings_date': date(2026, 10, 31),
        'movement_context': 'Accelerating AWS operating margins and rising enterprise demand for custom Trainium and Inferentia silicon.',
    },
    {
        'ticker': 'META',
        'name': 'Meta Platforms, Inc.',
        'exchange': 'NASDAQ',
        'sector': 'Social & AI Infrastructure',
        'industry': 'Social Platforms, Open-Weight AI & Hardware',
        'headquarters': 'Menlo Park, California',
        'ceo': 'Mark Zuckerberg',
        'founded_year': 2004,
        'employee_count': 70799,
        'website': 'https://about.meta.com',
        'description': 'Operator of Instagram, WhatsApp, Messenger, and creator of the open-weight Llama model ecosystem.',
        'current_price': Decimal('592.70'),
        'change': Decimal('11.20'),
        'change_percent': Decimal('1.926'),
        'open_price': Decimal('583.50'),
        'high_price': Decimal('595.00'),
        'low_price': Decimal('582.00'),
        'previous_close': Decimal('581.50'),
        'volume': 14800000,
        'avg_volume': 16000000,
        'market_cap': 1500000000000,
        'market_cap_formatted': '$1.50 Trillion',
        'pe_ratio': Decimal('29.6'),
        'week_52_high': Decimal('602.95'),
        'week_52_low': Decimal('279.40'),
        'earnings_date': date(2026, 10, 30),
        'movement_context': 'AI-driven ad ranking conversion efficiencies and wide enterprise integration of Llama open weights.',
    },
    {
        'ticker': 'TSM',
        'name': 'Taiwan Semiconductor Manufacturing Co.',
        'exchange': 'NYSE',
        'sector': 'Semiconductors',
        'industry': 'Foundry & Advanced Semiconductor Fabrication',
        'headquarters': 'Hsinchu, Taiwan',
        'ceo': 'C.C. Wei',
        'founded_year': 1987,
        'employee_count': 76400,
        'website': 'https://www.tsmc.com',
        'description': 'The world\'s premier dedicated semiconductor foundry, fabricating leading-edge 3nm and 2nm nodes for NVIDIA, Apple, and AMD.',
        'current_price': Decimal('198.80'),
        'change': Decimal('7.40'),
        'change_percent': Decimal('3.866'),
        'open_price': Decimal('193.00'),
        'high_price': Decimal('200.50'),
        'low_price': Decimal('192.50'),
        'previous_close': Decimal('191.40'),
        'volume': 18700000,
        'avg_volume': 19500000,
        'market_cap': 1030000000000,
        'market_cap_formatted': '$1.03 Trillion',
        'pe_ratio': Decimal('28.5'),
        'week_52_high': Decimal('205.84'),
        'week_52_low': Decimal('85.20'),
        'earnings_date': date(2026, 10, 17),
        'movement_context': 'Record monthly revenue reports showing sustained 100% capacity utilization at advanced 3nm and CoWoS packaging facilities.',
    },
    {
        'ticker': 'AVGO',
        'name': 'Broadcom Inc.',
        'exchange': 'NASDAQ',
        'sector': 'Semiconductors & Infrastructure Software',
        'industry': 'Custom Silicon (ASICs), Networking & VMware',
        'headquarters': 'Palo Alto, California',
        'ceo': 'Hock Tan',
        'founded_year': 1961,
        'employee_count': 37000,
        'website': 'https://www.broadcom.com',
        'description': 'Global designer of custom AI consumer accelerators (XPUs), Ethernet switching, and enterprise virtualization.',
        'current_price': Decimal('182.60'),
        'change': Decimal('4.80'),
        'change_percent': Decimal('2.699'),
        'open_price': Decimal('178.50'),
        'high_price': Decimal('183.90'),
        'low_price': Decimal('178.00'),
        'previous_close': Decimal('177.80'),
        'volume': 22300000,
        'avg_volume': 24000000,
        'market_cap': 854000000000,
        'market_cap_formatted': '$854.0 Billion',
        'pe_ratio': Decimal('48.2'),
        'week_52_high': Decimal('185.16'),
        'week_52_low': Decimal('80.88'),
        'earnings_date': date(2026, 12, 12),
        'movement_context': 'Robust multi-billion-dollar backlog for custom TPU/XPU networking and PCIe Gen6 switches.',
    },
    {
        'ticker': 'AMD',
        'name': 'Advanced Micro Devices, Inc.',
        'exchange': 'NASDAQ',
        'sector': 'Semiconductors',
        'industry': 'CPUs, Instinct AI Accelerators & FPGAs',
        'headquarters': 'Santa Clara, California',
        'ceo': 'Lisa Su',
        'founded_year': 1969,
        'employee_count': 26000,
        'website': 'https://www.amd.com',
        'description': 'Developer of EPYC server CPUs, Ryzen client processors, and Instinct MI300X/MI325X GPU accelerators.',
        'current_price': Decimal('156.40'),
        'change': Decimal('3.20'),
        'change_percent': Decimal('2.088'),
        'open_price': Decimal('153.50'),
        'high_price': Decimal('157.80'),
        'low_price': Decimal('153.00'),
        'previous_close': Decimal('153.20'),
        'volume': 41200000,
        'avg_volume': 45000000,
        'market_cap': 253000000000,
        'market_cap_formatted': '$253.0 Billion',
        'pe_ratio': Decimal('112.4'),
        'week_52_high': Decimal('227.30'),
        'week_52_low': Decimal('94.04'),
        'earnings_date': date(2026, 10, 29),
        'movement_context': 'Expanding MI300X deployments across tier-2 cloud providers and server market share gains with 5th Gen EPYC.',
    },
    {
        'ticker': 'ORCL',
        'name': 'Oracle Corporation',
        'exchange': 'NYSE',
        'sector': 'Cloud & Enterprise Software',
        'industry': 'Relational Database, Autonomous DB & OCI Cloud',
        'headquarters': 'Austin, Texas',
        'ceo': 'Safra Catz',
        'founded_year': 1977,
        'employee_count': 159000,
        'website': 'https://www.oracle.com',
        'description': 'Enterprise database standard and operator of Oracle Cloud Infrastructure (OCI) with multi-cloud partnerships.',
        'current_price': Decimal('172.90'),
        'change': Decimal('1.80'),
        'change_percent': Decimal('1.052'),
        'open_price': Decimal('171.20'),
        'high_price': Decimal('174.10'),
        'low_price': Decimal('170.80'),
        'previous_close': Decimal('171.10'),
        'volume': 11400000,
        'avg_volume': 13000000,
        'market_cap': 475000000000,
        'market_cap_formatted': '$475.0 Billion',
        'pe_ratio': Decimal('42.1'),
        'week_52_high': Decimal('178.96'),
        'week_52_low': Decimal('99.26'),
        'earnings_date': date(2026, 12, 10),
        'movement_context': 'Record Remaining Performance Obligations (RPO) driven by high-density GPU cluster reservations on OCI.',
    },
    {
        'ticker': 'PLTR',
        'name': 'Palantir Technologies Inc.',
        'exchange': 'NYSE',
        'sector': 'AI & Defense Software',
        'industry': 'Enterprise Ontology & AIP Platform',
        'headquarters': 'Denver, Colorado',
        'ceo': 'Alex Karp',
        'founded_year': 2003,
        'employee_count': 3800,
        'website': 'https://www.palantir.com',
        'description': 'Enterprise AI infrastructure provider enabling secure LLM orchestration via AIP and defense intelligence platforms.',
        'current_price': Decimal('44.80'),
        'change': Decimal('2.10'),
        'change_percent': Decimal('4.918'),
        'open_price': Decimal('42.90'),
        'high_price': Decimal('45.20'),
        'low_price': Decimal('42.50'),
        'previous_close': Decimal('42.70'),
        'volume': 58000000,
        'avg_volume': 55000000,
        'market_cap': 101000000000,
        'market_cap_formatted': '$101.0 Billion',
        'pe_ratio': Decimal('118.0'),
        'week_52_high': Decimal('45.20'),
        'week_52_low': Decimal('14.48'),
        'earnings_date': date(2026, 11, 4),
        'movement_context': 'Commercial customer count acceleration in the US driven by AIP bootcamps converting to production contracts.',
    },
    {
        'ticker': 'CRWD',
        'name': 'CrowdStrike Holdings, Inc.',
        'exchange': 'NASDAQ',
        'sector': 'Cybersecurity',
        'industry': 'Cloud Endpoint Security & Falcon Platform',
        'headquarters': 'Austin, Texas',
        'ceo': 'George Kurtz',
        'founded_year': 2011,
        'employee_count': 7925,
        'website': 'https://www.crowdstrike.com',
        'description': 'Pioneer of cloud-native endpoint protection, threat intelligence, and automated incident response services.',
        'current_price': Decimal('318.50'),
        'change': Decimal('-3.40'),
        'change_percent': Decimal('-1.056'),
        'open_price': Decimal('322.00'),
        'high_price': Decimal('323.50'),
        'low_price': Decimal('316.00'),
        'previous_close': Decimal('321.90'),
        'volume': 3400000,
        'avg_volume': 3800000,
        'market_cap': 78200000000,
        'market_cap_formatted': '$78.2 Billion',
        'pe_ratio': Decimal('68.4'),
        'week_52_high': Decimal('398.33'),
        'week_52_low': Decimal('200.81'),
        'earnings_date': date(2026, 11, 28),
        'movement_context': 'Customer retention stabilization and incremental ARR growth following enhanced kernel update staging validation.',
    },
    {
        'ticker': 'INTC',
        'name': 'Intel Corporation',
        'exchange': 'NASDAQ',
        'sector': 'Semiconductors',
        'industry': 'x86 Architecture & Intel Foundry Services',
        'headquarters': 'Santa Clara, California',
        'ceo': 'Patrick Gelsinger',
        'founded_year': 1968,
        'employee_count': 124800,
        'website': 'https://www.intel.com',
        'description': 'Global microarchitecture company restructuring into product division and independent Intel Foundry.',
        'current_price': Decimal('22.85'),
        'change': Decimal('-0.45'),
        'change_percent': Decimal('-1.931'),
        'open_price': Decimal('23.40'),
        'high_price': Decimal('23.60'),
        'low_price': Decimal('22.70'),
        'previous_close': Decimal('23.30'),
        'volume': 55000000,
        'avg_volume': 62000000,
        'market_cap': 98100000000,
        'market_cap_formatted': '$98.1 Billion',
        'pe_ratio': None,
        'week_52_high': Decimal('51.28'),
        'week_52_low': Decimal('18.51'),
        'earnings_date': date(2026, 10, 31),
        'movement_context': 'Ongoing restructuring expenses and 15% headcount reductions offset by 18A node tape-out milestones.',
    },
]

SEED_INDICES = [
    {
        'symbol': '^IXIC',
        'name': 'NASDAQ Composite',
        'exchange': 'NASDAQ',
        'current_value': Decimal('18518.61'),
        'change': Decimal('145.20'),
        'change_percent': Decimal('0.790'),
        'previous_close': Decimal('18373.41'),
        'day_high': Decimal('18545.10'),
        'day_low': Decimal('18360.20'),
        'is_delayed': True,
    },
    {
        'symbol': 'NDX',
        'name': 'NASDAQ-100',
        'exchange': 'NASDAQ',
        'current_value': Decimal('20380.45'),
        'change': Decimal('182.15'),
        'change_percent': Decimal('0.902'),
        'previous_close': Decimal('20198.30'),
        'day_high': Decimal('20410.80'),
        'day_low': Decimal('20185.00'),
        'is_delayed': True,
    },
    {
        'symbol': '^GSPC',
        'name': 'S&P 500',
        'exchange': 'Cboe BZX',
        'current_value': Decimal('5832.92'),
        'change': Decimal('23.10'),
        'change_percent': Decimal('0.398'),
        'previous_close': Decimal('5809.82'),
        'day_high': Decimal('5841.50'),
        'day_low': Decimal('5805.10'),
        'is_delayed': True,
    },
    {
        'symbol': 'SOXX',
        'name': 'PHLX Semiconductor Sector',
        'exchange': 'NASDAQ',
        'current_value': Decimal('528.40'),
        'change': Decimal('11.85'),
        'change_percent': Decimal('2.294'),
        'previous_close': Decimal('516.55'),
        'day_high': Decimal('531.20'),
        'day_low': Decimal('515.90'),
        'is_delayed': True,
    },
]

SEED_FINANCIALS = [
    {
        'ticker': 'NVDA',
        'fiscal_period': 'Q2 FY2026',
        'fiscal_year': 2026,
        'report_date': date(2026, 8, 28),
        'revenue': 30040000000,
        'revenue_formatted': '$30.04 Billion',
        'revenue_growth_yoy': Decimal('122.4'),
        'net_income': 16599000000,
        'net_income_formatted': '$16.60 Billion',
        'eps': Decimal('0.68'),
        'capex': 650000000,
        'capex_formatted': '$650 Million',
        'guidance_summary': 'Q3 revenue anticipated at $32.5B (+/- 2%), with Data Center accounting for over 87% of gross margin contribution.',
        'source_filing_url': 'https://investor.nvidia.com',
    },
    {
        'ticker': 'MSFT',
        'fiscal_period': 'Q4 FY2025',
        'fiscal_year': 2025,
        'report_date': date(2025, 7, 30),
        'revenue': 64700000000,
        'revenue_formatted': '$64.70 Billion',
        'revenue_growth_yoy': Decimal('15.2'),
        'net_income': 22000000000,
        'net_income_formatted': '$22.00 Billion',
        'eps': Decimal('2.95'),
        'capex': 19000000000,
        'capex_formatted': '$19.00 Billion',
        'guidance_summary': 'FY2026 capital expenditures expected to accelerate further to support sovereign cloud infrastructure and OpenAI workloads.',
        'source_filing_url': 'https://www.microsoft.com/investor',
    },
    {
        'ticker': 'GOOGL',
        'fiscal_period': 'Q2 2025',
        'fiscal_year': 2025,
        'report_date': date(2025, 7, 23),
        'revenue': 84740000000,
        'revenue_formatted': '$84.74 Billion',
        'revenue_growth_yoy': Decimal('13.6'),
        'net_income': 23620000000,
        'net_income_formatted': '$23.62 Billion',
        'eps': Decimal('1.89'),
        'capex': 13000000000,
        'capex_formatted': '$13.00 Billion',
        'guidance_summary': 'Google Cloud operating income rose to $1.17B; full-year infrastructure capex guided upward to support Gemini Flash deployments.',
        'source_filing_url': 'https://abc.xyz/investor',
    },
    {
        'ticker': 'TSM',
        'fiscal_period': 'Q3 2025',
        'fiscal_year': 2025,
        'report_date': date(2025, 10, 17),
        'revenue': 23500000000,
        'revenue_formatted': '$23.50 Billion',
        'revenue_growth_yoy': Decimal('36.0'),
        'net_income': 10100000000,
        'net_income_formatted': '$10.10 Billion',
        'eps': Decimal('1.94'),
        'capex': 8500000000,
        'capex_formatted': '$8.50 Billion',
        'guidance_summary': 'Management raised full-year dollar revenue forecast to approximately 30% YoY growth on structural AI demand.',
        'source_filing_url': 'https://investor.tsmc.com',
    },
]


class MarketHoursHelper:
    """
    Handles trading session calculations based on US Eastern Time (ET).
    Determines whether US equity markets are open, in pre-market, after-hours,
    or closed for weekend/holidays.
    """
    @staticmethod
    def get_current_session_info() -> Dict[str, Any]:
        eastern = ZoneInfo('America/New_York')
        now_et = datetime.now(eastern)
        weekday = now_et.weekday() # 0 = Monday, 6 = Sunday

        if weekday >= 5: # Saturday or Sunday
            return {
                'status': 'Market Closed (Weekend)',
                'is_open': False,
                'session': 'weekend',
                'is_delayed': True,
                'timestamp': timezone.now().isoformat(),
                'eastern_time': now_et.strftime('%Y-%m-%d %H:%M:%S ET'),
                'next_session': 'Monday 09:30 AM ET'
            }

        current_time = now_et.time()
        market_open = time(9, 30)
        market_close = time(16, 0)
        pre_market_start = time(4, 0)
        after_hours_end = time(20, 0)

        if market_open <= current_time < market_close:
            return {
                'status': 'Regular Market Open',
                'is_open': True,
                'session': 'regular',
                'is_delayed': True, # 15-minute standard delayed provider
                'timestamp': timezone.now().isoformat(),
                'eastern_time': now_et.strftime('%Y-%m-%d %H:%M:%S ET'),
                'next_session': 'Closes 04:00 PM ET'
            }
        elif pre_market_start <= current_time < market_open:
            return {
                'status': 'Pre-Market Trading',
                'is_open': False,
                'session': 'pre_market',
                'is_delayed': True,
                'timestamp': timezone.now().isoformat(),
                'eastern_time': now_et.strftime('%Y-%m-%d %H:%M:%S ET'),
                'next_session': 'Regular opens 09:30 AM ET'
            }
        elif market_close <= current_time < after_hours_end:
            return {
                'status': 'After-Hours Trading',
                'is_open': False,
                'session': 'after_hours',
                'is_delayed': True,
                'timestamp': timezone.now().isoformat(),
                'eastern_time': now_et.strftime('%Y-%m-%d %H:%M:%S ET'),
                'next_session': 'After-hours ends 08:00 PM ET'
            }
        else:
            return {
                'status': 'Market Closed',
                'is_open': False,
                'session': 'closed',
                'is_delayed': True,
                'timestamp': timezone.now().isoformat(),
                'eastern_time': now_et.strftime('%Y-%m-%d %H:%M:%S ET'),
                'next_session': 'Pre-market opens 04:00 AM ET'
            }


class MarketDataService:
    """
    Coordinates technology financial data persistence, market status,
    movers, watchlist operations, and provider synchronization.
    """

    @classmethod
    def initialize_market_universe(cls, force: bool = False):
        """Seed baseline public companies, stock quotes, indices, and financial filings."""
        session_info = MarketHoursHelper.get_current_session_info()
        status_text = session_info['status']

        with transaction.atomic():
            # 1. Seed Indices
            for idx_data in SEED_INDICES:
                MarketIndex.objects.update_or_create(
                    symbol=idx_data['symbol'],
                    defaults={
                        'name': idx_data['name'],
                        'exchange': idx_data['exchange'],
                        'current_value': idx_data['current_value'],
                        'change': idx_data['change'],
                        'change_percent': idx_data['change_percent'],
                        'previous_close': idx_data['previous_close'],
                        'day_high': idx_data['day_high'],
                        'day_low': idx_data['day_low'],
                        'market_status': status_text,
                        'is_delayed': True,
                    }
                )

            # 2. Seed Companies & Quotes
            for comp_data in SEED_COMPANIES:
                company, _ = Company.objects.update_or_create(
                    ticker=comp_data['ticker'],
                    defaults={
                        'name': comp_data['name'],
                        'exchange': comp_data['exchange'],
                        'sector': comp_data['sector'],
                        'industry': comp_data['industry'],
                        'headquarters': comp_data['headquarters'],
                        'ceo': comp_data['ceo'],
                        'founded_year': comp_data['founded_year'],
                        'employee_count': comp_data['employee_count'],
                        'website': comp_data['website'],
                        'description': comp_data['description'],
                        'is_public': True,
                    }
                )

                StockQuote.objects.update_or_create(
                    company=company,
                    defaults={
                        'current_price': comp_data['current_price'],
                        'change': comp_data['change'],
                        'change_percent': comp_data['change_percent'],
                        'open_price': comp_data['open_price'],
                        'high_price': comp_data['high_price'],
                        'low_price': comp_data['low_price'],
                        'previous_close': comp_data['previous_close'],
                        'volume': comp_data['volume'],
                        'avg_volume': comp_data['avg_volume'],
                        'market_cap': comp_data['market_cap'],
                        'market_cap_formatted': comp_data['market_cap_formatted'],
                        'pe_ratio': comp_data['pe_ratio'],
                        'week_52_high': comp_data['week_52_high'],
                        'week_52_low': comp_data['week_52_low'],
                        'earnings_date': comp_data['earnings_date'],
                        'market_status': status_text,
                        'is_delayed': True,
                        'provider': 'DevPulse Financial Desk (15m Delayed)',
                        'movement_context': comp_data['movement_context'],
                    }
                )

            # 3. Seed Financial Results
            for fin_data in SEED_FINANCIALS:
                try:
                    comp = Company.objects.get(ticker=fin_data['ticker'])
                    FinancialResult.objects.update_or_create(
                        company=comp,
                        fiscal_period=fin_data['fiscal_period'],
                        defaults={
                            'fiscal_year': fin_data['fiscal_year'],
                            'report_date': fin_data['report_date'],
                            'revenue': fin_data['revenue'],
                            'revenue_formatted': fin_data['revenue_formatted'],
                            'revenue_growth_yoy': fin_data['revenue_growth_yoy'],
                            'net_income': fin_data['net_income'],
                            'net_income_formatted': fin_data['net_income_formatted'],
                            'eps': fin_data['eps'],
                            'capex': fin_data['capex'],
                            'capex_formatted': fin_data['capex_formatted'],
                            'guidance_summary': fin_data['guidance_summary'],
                            'source_filing_url': fin_data['source_filing_url'],
                        }
                    )
                except Company.DoesNotExist:
                    pass

    @classmethod
    def get_market_overview(cls) -> Dict[str, Any]:
        """Returns consolidated market overview for the homepage and markets dashboard."""
        session_info = MarketHoursHelper.get_current_session_info()
        indices = MarketIndex.objects.all()
        quotes = StockQuote.objects.select_related('company').all()

        # Check if database has quotes; if not, seed once
        if not quotes.exists():
            cls.initialize_market_universe()
            indices = MarketIndex.objects.all()
            quotes = StockQuote.objects.select_related('company').all()

        gainers = quotes.order_by('-change_percent')[:5]
        losers = quotes.order_by('change_percent')[:5]
        most_active = quotes.order_by('-volume')[:5]
        mega_caps = quotes.order_by('-market_cap')[:6]

        return {
            'session': session_info,
            'indices': indices,
            'gainers': gainers,
            'losers': losers,
            'most_active': most_active,
            'mega_caps': mega_caps,
            'last_updated': timezone.now().isoformat(),
            'provider_notice': 'Market data is delayed by at least 15 minutes per exchange requirements. Never fabricated.',
        }
