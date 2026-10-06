def property_payload(**overrides):
    return {
        "slug": "casa-prueba",
        "status": "draft",
        "title": "Casa de prueba",
        "description": "Propiedad de prueba automatizada.",
        "operation": "sale",
        "property_type": "house",
        "price": "2500000.50",
        "currency": "MXN",
        "location": {"city": "Puebla", "state": "Puebla", "neighborhood": "Centro"},
        "features": {"area_m2": 180, "bedrooms": 3, "bathrooms": 2, "parking_spaces": 2},
        "images": [{"url": "/img/test.jpg", "alt": "Fachada", "width": 1200, "height": 800}],
        **overrides,
    }


def kitchen_payload(**overrides):
    return {
        "current_situation": "remodelacion",
        "interior_board": {"id": "interior-a", "label": "Interior de prueba"},
        "exterior_fronts": {"id": "frente-a"},
        "hardware": {"id": "herrajes-a"},
        "countertop": {"id": "solid-surface", "label": "Superficie sólida Corian"},
        "finish": {"id": "acabado-a"},
        "extras": [{"id": "led", "quantity": 1}],
        "address": "Dirección de prueba",
        "latitude": 19.043,
        "longitude": -98.198,
        "branch": "Sucursal de prueba",
        "advisor": "Asesor de prueba",
        "requested_datetime": "2030-10-12T10:00:00-06:00",
        "selection_version": 1,
        "selections": {"catalog_version": "test", "selected_ids": ["led"]},
        **overrides,
    }


def appointment_payload(**overrides):
    return {
        "requested_datetime": "2030-10-12T10:00:00-06:00",
        "branch": "Sucursal de prueba",
        "address": "Dirección de prueba",
        "latitude": 19.043,
        "longitude": -98.198,
        **overrides,
    }


def contact_payload(**overrides):
    return {
        "source": "kitchen",
        "name": "Persona de prueba",
        "phone": "+52 222 123 4567",
        "email": "persona@example.com",
        **overrides,
    }
