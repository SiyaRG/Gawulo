# Generated migration for email-based auth, 2FA, and OAuth

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
from django.utils import timezone


def update_usernames_to_email(apps, schema_editor):
    """Update all existing users to use email as username."""
    User = apps.get_model('auth', 'User')
    for user in User.objects.all():
        if user.email and user.username != user.email:
            # Check if username already exists
            if not User.objects.filter(username=user.email).exists():
                user.username = user.email
                user.save()


def clear_auth_data(apps, schema_editor):
    """Clear existing authentication-related data."""
    User = apps.get_model('auth', 'User')
    # Delete all users (cascade will handle related data)
    User.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('auth_api', '0004_userprofile_languages_userprofile_primary_language'),
    ]

    operations = [
        # Add two_factor_enabled field to UserProfile
        migrations.AddField(
            model_name='userprofile',
            name='two_factor_enabled',
            field=models.BooleanField(default=False, help_text='Whether two-factor authentication is enabled for this user'),
        ),
        # Create OTPVerification model
        migrations.CreateModel(
            name='OTPVerification',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('otp_hash', models.CharField(max_length=64)),
                ('expires_at', models.DateTimeField()),
                ('is_used', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('session_token', models.CharField(blank=True, max_length=64, null=True, unique=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='otp_verifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'OTP Verification',
                'verbose_name_plural': 'OTP Verifications',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='otpverification',
            index=models.Index(fields=['user', 'is_used', 'expires_at'], name='auth_api_otp_user_used_exp'),
        ),
        migrations.AddIndex(
            model_name='otpverification',
            index=models.Index(fields=['session_token'], name='auth_api_otp_session_token'),
        ),
        # Create OAuthAccount model
        migrations.CreateModel(
            name='OAuthAccount',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('provider', models.CharField(choices=[('google', 'Google'), ('facebook', 'Facebook')], max_length=50)),
                ('provider_user_id', models.CharField(max_length=255)),
                ('email', models.EmailField(max_length=254)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='oauth_accounts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'OAuth Account',
                'verbose_name_plural': 'OAuth Accounts',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='oauthaccount',
            index=models.Index(fields=['provider', 'provider_user_id'], name='auth_api_oauth_provider_id'),
        ),
        migrations.AddIndex(
            model_name='oauthaccount',
            index=models.Index(fields=['user', 'provider'], name='auth_api_oauth_user_provider'),
        ),
        migrations.AddIndex(
            model_name='oauthaccount',
            index=models.Index(fields=['email'], name='auth_api_oauth_email'),
        ),
        migrations.AlterUniqueTogether(
            name='oauthaccount',
            unique_together={('provider', 'provider_user_id')},
        ),
        # Update usernames to email
        migrations.RunPython(update_usernames_to_email, reverse_code=migrations.RunPython.noop),
        # Clear authentication data
        migrations.RunPython(clear_auth_data, reverse_code=migrations.RunPython.noop),
    ]

