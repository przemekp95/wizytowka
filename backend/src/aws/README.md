# S3 image storage

This module provides the S3 upload adapter used by portfolio mutations. It does
not provide SES or CloudWatch integration.

The portfolio controller accepts JPEG, PNG, or WebP up to 5 MiB and verifies
that the file signature matches the declared MIME type before the adapter is
called. Object filename extensions are derived from the verified MIME type,
not from the client-provided filename.
