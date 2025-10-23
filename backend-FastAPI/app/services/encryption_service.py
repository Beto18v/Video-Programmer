"""
Secure Token Encryption Service

This module provides secure encryption/decryption for sensitive tokens
using Fernet symmetric encryption from the cryptography library.
"""

import base64
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from typing import Optional


class TokenEncryptionService:
    """Service for encrypting and decrypting sensitive tokens."""

    def __init__(self, encryption_key: Optional[str] = None):
        """
        Initialize the encryption service.

        Args:
            encryption_key: Base64-encoded 32-byte key. If None, uses env var.
        """
        if encryption_key is None:
            from app.core.config import get_settings
            settings = get_settings()
            encryption_key = settings.encryption_key

        if not encryption_key or encryption_key == "your-32-byte-base64-encryption-key-here":
            raise ValueError(
                "Encryption key not configured. Set ENCRYPTION_KEY in .env file."
            )

        # Validate and prepare the key
        try:
            self.fernet = Fernet(encryption_key.encode())
        except Exception as e:
            raise ValueError(f"Invalid encryption key: {e}")

    @staticmethod
    def generate_key() -> str:
        """Generate a new encryption key."""
        return base64.urlsafe_b64encode(os.urandom(32)).decode()

    def encrypt_token(self, token: str) -> str:
        """
        Encrypt a token.

        Args:
            token: The plain text token to encrypt

        Returns:
            Base64-encoded encrypted token
        """
        if not token:
            return ""

        encrypted = self.fernet.encrypt(token.encode())
        return encrypted.decode()

    def decrypt_token(self, encrypted_token: str) -> str:
        """
        Decrypt a token.

        Args:
            encrypted_token: The encrypted token to decrypt

        Returns:
            The decrypted plain text token

        Raises:
            ValueError: If decryption fails
        """
        if not encrypted_token:
            return ""

        try:
            decrypted = self.fernet.decrypt(encrypted_token.encode())
            return decrypted.decode()
        except Exception as e:
            raise ValueError(f"Failed to decrypt token: {e}")

    def is_encrypted(self, token: str) -> bool:
        """
        Check if a token appears to be encrypted.

        Args:
            token: The token to check

        Returns:
            True if the token appears to be encrypted
        """
        if not token:
            return False

        try:
            # Try to decrypt - if it works, it's encrypted
            self.decrypt_token(token)
            return True
        except ValueError:
            return False


# Global instance for easy access
_encryption_service: Optional[TokenEncryptionService] = None

def get_encryption_service() -> TokenEncryptionService:
    """Get the global encryption service instance."""
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = TokenEncryptionService()
    return _encryption_service


def encrypt_token(token: str) -> str:
    """Convenience function to encrypt a token."""
    return get_encryption_service().encrypt_token(token)


def decrypt_token(encrypted_token: str) -> str:
    """Convenience function to decrypt a token."""
    return get_encryption_service().decrypt_token(encrypted_token)


# Example usage and testing
if __name__ == "__main__":
    # Generate a key for testing
    test_key = TokenEncryptionService.generate_key()
    print(f"Generated encryption key: {test_key}")

    # Create service with test key
    service = TokenEncryptionService(test_key)

    # Test encryption/decryption
    test_token = "ya29.abc123def456"  # Example OAuth token

    encrypted = service.encrypt_token(test_token)
    print(f"Original: {test_token}")
    print(f"Encrypted: {encrypted}")

    decrypted = service.decrypt_token(encrypted)
    print(f"Decrypted: {decrypted}")

    assert decrypted == test_token, "Encryption/decryption failed!"
    print("✅ Encryption/decryption test passed!")