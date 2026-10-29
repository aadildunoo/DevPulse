from rest_framework import serializers
from news.models import Category, Technology, Source, Article, ArticleIntelligence, ArticleCorrection, DailyBriefing, IngestionJob

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'display_order']


class TechnologySerializer(serializers.ModelSerializer):
    category_slug = serializers.CharField(source='category.slug', read_only=True)

    class Meta:
        model = Technology
        fields = ['id', 'name', 'slug', 'description', 'website', 'doc_url', 'github_repo', 'icon', 'is_trending', 'follower_count', 'category_slug']


class SourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Source
        fields = ['id', 'name', 'slug', 'source_type', 'url', 'site_url', 'reliability_tier', 'is_active', 'last_polled_at', 'last_success_at', 'consecutive_failures']


class ArticleIntelligenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleIntelligence
        fields = [
            'concise_summary',
            'detailed_summary',
            'what_happened',
            'why_it_matters',
            'developer_impact',
            'positive_implications',
            'negative_implications',
            'risks_and_limitations',
            'recommended_actions',
            'affected_versions',
            'who_is_affected',
            'supporting_evidence',
            'uncertainty_notes',
            'provider',
            'updated_at',
        ]


class ArticleCorrectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleCorrection
        fields = ['id', 'original_claim', 'correction_text', 'corrected_at', 'editor_notes']


class ArticleListSerializer(serializers.ModelSerializer):
    source_name = serializers.CharField(source='source.name', read_only=True)
    source_slug = serializers.CharField(source='source.slug', read_only=True)
    source_tier = serializers.CharField(source='source.reliability_tier', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    technologies = TechnologySerializer(many=True, read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    concise_summary = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            'id',
            'title',
            'subheadline',
            'slug',
            'canonical_url',
            'original_url',
            'author',
            'editorial_desk',
            'article_type',
            'source_name',
            'source_slug',
            'source_tier',
            'category_name',
            'category_slug',
            'categories',
            'technologies',
            'primary_event_type',
            'primary_companies',
            'stock_symbols',
            'lead_image_url',
            'lead_image_caption',
            'editorial_status',
            'importance_score',
            'importance_explanation',
            'is_breaking',
            'is_developing',
            'is_editorial_pick',
            'read_time_minutes',
            'published_at',
            'updated_at',
            'ingested_at',
            'concise_summary',
        ]

    def get_concise_summary(self, obj):
        if obj.subheadline:
            return obj.subheadline
        if hasattr(obj, 'intelligence') and obj.intelligence and obj.intelligence.concise_summary:
            return obj.intelligence.concise_summary
        return obj.summary_raw[:220] if obj.summary_raw else ""


class ArticleDetailSerializer(serializers.ModelSerializer):
    source = SourceSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    technologies = TechnologySerializer(many=True, read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    intelligence = ArticleIntelligenceSerializer(read_only=True)
    corrections = ArticleCorrectionSerializer(many=True, read_only=True)
    related_articles = serializers.SerializerMethodField()
    paragraphs = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            'id',
            'title',
            'subheadline',
            'slug',
            'canonical_url',
            'original_url',
            'author',
            'editorial_desk',
            'article_type',
            'summary_raw',
            'content_raw',
            'body_paragraphs',
            'paragraphs',
            'background_context',
            'why_it_matters_text',
            'implications_analysis',
            'what_happens_next',
            'sources_and_references',
            'primary_companies',
            'stock_symbols',
            'lead_image_url',
            'lead_image_caption',
            'lead_image_credit',
            'editorial_status',
            'ai_generation_status',
            'verification_status',
            'published_at',
            'updated_at',
            'ingested_at',
            'source',
            'category',
            'categories',
            'technologies',
            'primary_event_type',
            'importance_score',
            'importance_explanation',
            'is_breaking',
            'is_developing',
            'is_editorial_pick',
            'read_time_minutes',
            'view_count',
            'bookmark_count',
            'intelligence',
            'corrections',
            'related_articles',
        ]

    def get_paragraphs(self, obj):
        if obj.body_paragraphs and len(obj.body_paragraphs) > 0:
            return obj.body_paragraphs

        # Intelligent paragraph generator from existing raw content
        raw = obj.content_raw or obj.summary_raw or ""
        import re
        from bs4 import BeautifulSoup
        clean_text = BeautifulSoup(raw, 'html.parser').get_text(separator='\n')
        chunks = [p.strip() for p in clean_text.split('\n') if len(p.strip()) > 40]
        if chunks:
            return chunks

        # Fallback to structured intelligence synthesis
        if hasattr(obj, 'intelligence') and obj.intelligence:
            intel = obj.intelligence
            parts = []
            if intel.what_happened:
                parts.append(intel.what_happened)
            if intel.why_it_matters:
                parts.append(intel.why_it_matters)
            if intel.developer_impact:
                parts.append(intel.developer_impact)
            return parts

        return [obj.title]

    def get_related_articles(self, obj):
        related = Article.objects.filter(
            category=obj.category
        ).exclude(pk=obj.pk).order_by('-published_at')[:4]
        return ArticleListSerializer(related, many=True).data


class DailyBriefingSerializer(serializers.ModelSerializer):
    top_stories = ArticleListSerializer(many=True, read_only=True)

    class Meta:
        model = DailyBriefing
        fields = ['id', 'date', 'title', 'overview', 'reading_time_minutes', 'top_stories', 'created_at']


class IngestionJobSerializer(serializers.ModelSerializer):
    source_name = serializers.CharField(source='source.name', read_only=True)

    class Meta:
        model = IngestionJob
        fields = ['id', 'source_name', 'status', 'items_found', 'items_created', 'items_updated', 'error_message', 'started_at', 'completed_at']
