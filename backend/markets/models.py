from django.db import models
from django.utils.text import slugify
from django.contrib.auth.models import User


class Company(models.Model):
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=220, unique=True)
    ticker = models.CharField(max_length=20, unique=True, db_index=True)
    exchange = models.CharField(max_length=50, default='NASDAQ')
    sector = models.CharField(max_length=100, default='Technology')
    industry = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    description = models.TextField(blank=True)
    founded_year = models.IntegerField(null=True, blank=True)
    headquarters = models.CharField(max_length=150, blank=True)
    ceo = models.CharField(max_length=100, blank=True)
    employee_count = models.IntegerField(null=True, blank=True)
    is_public = models.BooleanField(default=True)
    logo_url = models.URLField(blank=True)

    class Meta:
        verbose_name_plural = "Companies"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.ticker})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        if self.ticker:
            self.ticker = self.ticker.upper().strip()
        super().save(*args, **kwargs)


class MarketIndex(models.Model):
    symbol = models.CharField(max_length=20, unique=True) # e.g. ^IXIC, NDX, ^GSPC, SOXX
    name = models.CharField(max_length=100) # e.g. NASDAQ Composite, S&P 500, PHLX Semiconductor
    exchange = models.CharField(max_length=50, blank=True)
    current_value = models.DecimalField(max_digits=12, decimal_places=2)
    change = models.DecimalField(max_digits=10, decimal_places=2)
    change_percent = models.DecimalField(max_digits=7, decimal_places=3)
    previous_close = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    day_high = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    day_low = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    market_status = models.CharField(max_length=40, default='Market Closed')
    is_delayed = models.BooleanField(default=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Market Indices"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.symbol}): {self.current_value} ({self.change_percent:+.2f}%)"


class StockQuote(models.Model):
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name='quote')
    current_price = models.DecimalField(max_digits=12, decimal_places=2)
    change = models.DecimalField(max_digits=10, decimal_places=2)
    change_percent = models.DecimalField(max_digits=7, decimal_places=3)
    open_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    high_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    low_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    previous_close = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    volume = models.BigIntegerField(default=0)
    avg_volume = models.BigIntegerField(default=0, null=True, blank=True)
    market_cap = models.BigIntegerField(default=0, null=True, blank=True)
    market_cap_formatted = models.CharField(max_length=50, blank=True)
    pe_ratio = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    week_52_high = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    week_52_low = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    earnings_date = models.DateField(null=True, blank=True)
    market_status = models.CharField(max_length=40, default='Market Closed')
    is_delayed = models.BooleanField(default=True)
    provider = models.CharField(max_length=50, default='DevPulse Financial Desk')
    movement_context = models.TextField(blank=True, help_text="Evidence-grounded reporting on notable price movement")
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-market_cap']

    def __str__(self):
        return f"{self.company.ticker}: ${self.current_price} ({self.change_percent:+.2f}%)"


class FinancialResult(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='financial_results')
    fiscal_period = models.CharField(max_length=30) # e.g. Q4 2025, Q1 2026
    fiscal_year = models.IntegerField(default=2026)
    report_date = models.DateField()
    revenue = models.BigIntegerField(null=True, blank=True, help_text="Revenue in USD")
    revenue_formatted = models.CharField(max_length=50, blank=True)
    revenue_growth_yoy = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    net_income = models.BigIntegerField(null=True, blank=True)
    net_income_formatted = models.CharField(max_length=50, blank=True)
    eps = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    capex = models.BigIntegerField(null=True, blank=True)
    capex_formatted = models.CharField(max_length=50, blank=True)
    guidance_summary = models.TextField(blank=True)
    source_filing_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-report_date']
        unique_together = ['company', 'fiscal_period']

    def __str__(self):
        return f"{self.company.ticker} {self.fiscal_period} Earnings: {self.revenue_formatted}"


class WatchlistItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlist_items')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='watchers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'company']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} watching {self.company.ticker}"
