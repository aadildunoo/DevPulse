from rest_framework import serializers
from markets.models import Company, MarketIndex, StockQuote, FinancialResult, WatchlistItem


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            'id',
            'name',
            'slug',
            'ticker',
            'exchange',
            'sector',
            'industry',
            'website',
            'description',
            'founded_year',
            'headquarters',
            'ceo',
            'employee_count',
            'is_public',
            'logo_url',
        ]


class MarketIndexSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketIndex
        fields = [
            'id',
            'symbol',
            'name',
            'exchange',
            'current_value',
            'change',
            'change_percent',
            'previous_close',
            'day_high',
            'day_low',
            'market_status',
            'is_delayed',
            'last_updated',
        ]


class FinancialResultSerializer(serializers.ModelSerializer):
    ticker = serializers.CharField(source='company.ticker', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = FinancialResult
        fields = [
            'id',
            'ticker',
            'company_name',
            'fiscal_period',
            'fiscal_year',
            'report_date',
            'revenue',
            'revenue_formatted',
            'revenue_growth_yoy',
            'net_income',
            'net_income_formatted',
            'eps',
            'capex',
            'capex_formatted',
            'guidance_summary',
            'source_filing_url',
            'created_at',
        ]


class StockQuoteSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    ticker = serializers.CharField(source='company.ticker', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    exchange = serializers.CharField(source='company.exchange', read_only=True)
    sector = serializers.CharField(source='company.sector', read_only=True)

    class Meta:
        model = StockQuote
        fields = [
            'id',
            'ticker',
            'company_name',
            'exchange',
            'sector',
            'company',
            'current_price',
            'change',
            'change_percent',
            'open_price',
            'high_price',
            'low_price',
            'previous_close',
            'volume',
            'avg_volume',
            'market_cap',
            'market_cap_formatted',
            'pe_ratio',
            'week_52_high',
            'week_52_low',
            'earnings_date',
            'market_status',
            'is_delayed',
            'provider',
            'movement_context',
            'last_updated',
        ]


class WatchlistItemSerializer(serializers.ModelSerializer):
    quote = serializers.SerializerMethodField()
    company = CompanySerializer(read_only=True)

    class Meta:
        model = WatchlistItem
        fields = ['id', 'company', 'quote', 'created_at']

    def get_quote(self, obj):
        quote = getattr(obj.company, 'quote', None)
        if quote:
            return StockQuoteSerializer(quote).data
        return None
