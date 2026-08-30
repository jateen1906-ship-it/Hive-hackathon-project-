"""Thin Razorpay client wrapper + signature verification."""
import hmac
import hashlib
import logging
import razorpay

from ..config import settings

logger = logging.getLogger("truckshield.razorpay")


def get_client() -> razorpay.Client:
    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    return client


def verify_payment_signature(payment_id: str, subscription_id: str, signature: str) -> bool:
    """For subscriptions: HMAC_SHA256(payment_id + '|' + subscription_id, secret)."""
    msg = f"{payment_id}|{subscription_id}"
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(), msg.encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature or "")


def verify_order_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """For orders: HMAC_SHA256(order_id + '|' + payment_id, secret)."""
    msg = f"{order_id}|{payment_id}"
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(), msg.encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature or "")


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature or "")
