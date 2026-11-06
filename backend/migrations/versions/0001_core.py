"""Initial domain tables, native enums, constraints, indexes and timestamp triggers."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001_core"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():

    op.create_table(
        "appointments",
        sa.Column("requested_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("confirmed_datetime", sa.DateTime(timezone=True), nullable=True),
        sa.Column("branch", sa.String(length=160), nullable=False),
        sa.Column("address", sa.String(length=1000), nullable=False),
        sa.Column("latitude", sa.Double(), nullable=True),
        sa.Column("longitude", sa.Double(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "requested",
                "pending_confirmation",
                "confirmed",
                "completed",
                "cancelled",
                name="appointment_status",
            ),
            nullable=False,
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status NOT IN ('confirmed', 'completed') OR confirmed_datetime IS NOT NULL",
            name="ck_appointments_confirmation",
        ),
        sa.CheckConstraint(
            "(latitude IS NULL) = (longitude IS NULL)", name="ck_appointments_coordinates_pair"
        ),
        sa.CheckConstraint(
            "latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180",
            name="ck_appointments_coordinates_range",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_appointments_status_requested",
        "appointments",
        ["status", "requested_datetime"],
        unique=False,
    )
    op.create_table(
        "kitchen_configurations",
        sa.Column("current_situation", sa.String(length=200), nullable=False),
        sa.Column("interior_board", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("exterior_fronts", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("hardware", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("countertop", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("finish", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("extras", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("address", sa.String(length=1000), nullable=False),
        sa.Column("latitude", sa.Double(), nullable=True),
        sa.Column("longitude", sa.Double(), nullable=True),
        sa.Column("branch", sa.String(length=160), nullable=False),
        sa.Column("advisor", sa.String(length=160), nullable=True),
        sa.Column("requested_datetime", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("selection_version", sa.Integer(), nullable=False),
        sa.Column("selections", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "jsonb_typeof(selections) = 'object' AND jsonb_typeof(extras) = 'array'",
            name="ck_kitchen_selections",
        ),
        sa.CheckConstraint(
            "(latitude IS NULL) = (longitude IS NULL)", name="ck_kitchen_coordinates_pair"
        ),
        sa.CheckConstraint(
            "latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180",
            name="ck_kitchen_coordinates_range",
        ),
        sa.CheckConstraint("selection_version >= 1", name="ck_kitchen_selection_version"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "properties",
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column(
            "status",
            sa.Enum("draft", "published", "archived", name="property_status"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("operation", sa.Enum("sale", "rent", name="property_operation"), nullable=False),
        sa.Column(
            "property_type",
            sa.Enum("house", "apartment", "land", name="property_type"),
            nullable=False,
        ),
        sa.Column("price", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("location", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("latitude", sa.Double(), nullable=True),
        sa.Column("longitude", sa.Double(), nullable=True),
        sa.Column("features", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("currency ~ '^[A-Z]{3}$'", name="ck_properties_currency"),
        sa.CheckConstraint(
            "jsonb_typeof(location) = 'object' AND jsonb_typeof(features) = 'object'",
            name="ck_properties_objects",
        ),
        sa.CheckConstraint("slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'", name="ck_properties_slug"),
        sa.CheckConstraint(
            "(latitude IS NULL) = (longitude IS NULL)", name="ck_properties_coordinates_pair"
        ),
        sa.CheckConstraint(
            "latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180",
            name="ck_properties_coordinates_range",
        ),
        sa.CheckConstraint("price >= 0", name="ck_properties_price"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="uq_properties_slug"),
    )
    op.create_index(
        "ix_properties_status_created_at",
        "properties",
        ["status", "created_at", "id"],
        unique=False,
    )
    op.create_table(
        "leads",
        sa.Column("source", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("property_id", sa.UUID(), nullable=True),
        sa.Column("kitchen_configuration_id", sa.UUID(), nullable=True),
        sa.Column("appointment_id", sa.UUID(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("new", "contacted", "qualified", "closed", name="lead_status"),
            nullable=False,
        ),
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["kitchen_configuration_id"], ["kitchen_configurations.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_leads_appointment_id"), "leads", ["appointment_id"], unique=False)
    op.create_index(
        op.f("ix_leads_kitchen_configuration_id"),
        "leads",
        ["kitchen_configuration_id"],
        unique=False,
    )
    op.create_index(op.f("ix_leads_property_id"), "leads", ["property_id"], unique=False)
    op.create_index("ix_leads_status_created", "leads", ["status", "created_at"], unique=False)
    op.create_table(
        "property_images",
        sa.Column("property_id", sa.UUID(), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("object_key", sa.String(length=1024), nullable=True),
        sa.Column("alt", sa.String(length=250), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "width > 0 AND height > 0 AND position >= 0", name="ck_property_images_dimensions"
        ),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("property_id", "position", name="uq_property_images_position"),
    )

    op.execute("""CREATE FUNCTION mhg_touch_updated_at() RETURNS trigger AS $$
        BEGIN NEW.updated_at = clock_timestamp(); RETURN NEW; END;
        $$ LANGUAGE plpgsql""")
    op.execute(
        "CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION mhg_touch_updated_at()"
    )
    op.execute(
        "CREATE TRIGGER trg_kitchen_configurations_updated_at BEFORE UPDATE ON kitchen_configurations FOR EACH ROW EXECUTE FUNCTION mhg_touch_updated_at()"
    )
    op.execute(
        "CREATE TRIGGER trg_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION mhg_touch_updated_at()"
    )
    op.execute(
        "CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION mhg_touch_updated_at()"
    )
    op.execute(
        "CREATE TRIGGER trg_property_images_updated_at BEFORE UPDATE ON property_images FOR EACH ROW EXECUTE FUNCTION mhg_touch_updated_at()"
    )


def downgrade():
    op.drop_table("property_images")
    op.drop_table("leads")
    op.drop_table("properties")
    op.drop_table("kitchen_configurations")
    op.drop_table("appointments")
    op.execute("DROP FUNCTION mhg_touch_updated_at()")
    op.execute("DROP TYPE lead_status")
    op.execute("DROP TYPE property_type")
    op.execute("DROP TYPE property_operation")
    op.execute("DROP TYPE property_status")
    op.execute("DROP TYPE appointment_status")
