"""rename stripe columns to mercado pago

Revision ID: 4165e2800989
Revises: 15c45abd2f3c
Create Date: 2025-10-23 11:08:33.284171

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4165e2800989'
down_revision: Union[str, Sequence[str], None] = '15c45abd2f3c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Rename stripe_customer_id to mercado_pago_customer_id
    op.alter_column('users', 'stripe_customer_id', new_column_name='mercado_pago_customer_id')
    # Rename card_registered_at to payment_registered_at
    op.alter_column('users', 'card_registered_at', new_column_name='payment_registered_at')
    # Rename index
    op.drop_index('ix_users_stripe_customer_id', table_name='users')
    op.create_index(op.f('ix_users_mercado_pago_customer_id'), 'users', ['mercado_pago_customer_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Rename back to original names
    op.alter_column('users', 'mercado_pago_customer_id', new_column_name='stripe_customer_id')
    op.alter_column('users', 'payment_registered_at', new_column_name='card_registered_at')
    # Rename index back
    op.drop_index('ix_users_mercado_pago_customer_id', table_name='users')
    op.create_index(op.f('ix_users_stripe_customer_id'), 'users', ['stripe_customer_id'], unique=False)
