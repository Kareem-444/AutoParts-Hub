"""
Management command to populate the database with demo data.

Usage:  python manage.py seed
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from api.models import Category, Product, Review, SellerProfile

User = get_user_model()


class Command(BaseCommand):
    help = "Populate the database with demo categories, products, users, and reviews."

    def handle(self, *args, **options):
        self.stdout.write("Seeding database …")

        # ------------------------------------------------------------------
        # Users
        # ------------------------------------------------------------------
        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@carparts.com",
                "is_staff": True,
                "is_superuser": True,
                "is_seller": True,
            },
        )
        admin_user.set_password("admin123")
        admin_user.save()
        Token.objects.get_or_create(user=admin_user)

        seller1, _ = User.objects.get_or_create(
            username="autozone",
            defaults={
                "email": "seller@autozone.com",
                "is_seller": True,
                "phone": "+1-555-0101",
            },
        )
        seller1.set_password("seller123")
        seller1.save()
        Token.objects.get_or_create(user=seller1)
        SellerProfile.objects.get_or_create(
            user=seller1,
            defaults={
                "store_name": "AutoZone Parts Hub",
                "description": "Premium OEM and aftermarket car parts since 2010.",
            },
        )

        seller2, _ = User.objects.get_or_create(
            username="partspro",
            defaults={
                "email": "info@partspro.com",
                "is_seller": True,
                "phone": "+1-555-0202",
            },
        )
        seller2.set_password("seller123")
        seller2.save()
        Token.objects.get_or_create(user=seller2)
        SellerProfile.objects.get_or_create(
            user=seller2,
            defaults={
                "store_name": "Parts Pro International",
                "description": "Your one-stop shop for all car spare parts.",
            },
        )

        buyer, _ = User.objects.get_or_create(
            username="john",
            defaults={
                "email": "john@example.com",
                "phone": "+1-555-0303",
                "address": "123 Main St, Springfield, IL 62701",
            },
        )
        buyer.set_password("buyer123")
        buyer.save()
        Token.objects.get_or_create(user=buyer)

        # ------------------------------------------------------------------
        # Categories
        # ------------------------------------------------------------------
        categories_data = [
            {"name": "Engine Parts", "slug": "engine-parts", "description": "Complete engine components and accessories"},
            {"name": "Brake System", "slug": "brake-system", "description": "Brake pads, rotors, callipers, and fluid"},
            {"name": "Suspension", "slug": "suspension", "description": "Shocks, struts, springs, and control arms"},
            {"name": "Electrical", "slug": "electrical", "description": "Batteries, alternators, starters, and wiring"},
            {"name": "Body Parts", "slug": "body-parts", "description": "Bumpers, fenders, mirrors, and panels"},
            {"name": "Interior", "slug": "interior", "description": "Seats, floor mats, steering wheels, and trim"},
            {"name": "Exhaust System", "slug": "exhaust-system", "description": "Mufflers, catalytic converters, and pipes"},
            {"name": "Transmission", "slug": "transmission", "description": "Clutches, gearboxes, and drivetrain parts"},
        ]

        cats = {}
        for data in categories_data:
            cat, _ = Category.objects.get_or_create(slug=data["slug"], defaults=data)
            cats[data["slug"]] = cat

        # ------------------------------------------------------------------
        # Products
        # ------------------------------------------------------------------
        products_data = [
            # Engine Parts
            {"title": "High-Performance Air Filter", "price": 34.99, "stock": 150, "condition": "new", "car_make": "Universal", "car_model": "All Models", "car_year": "2015-2024", "category": "engine-parts", "seller": seller1, "featured": True, "description": "Premium washable and reusable air filter that increases horsepower and acceleration. Designed to provide up to 50% more airflow than disposable paper filters."},
            {"title": "Timing Belt Kit", "price": 89.95, "stock": 45, "condition": "new", "car_make": "Toyota", "car_model": "Camry", "car_year": "2012-2020", "category": "engine-parts", "seller": seller1, "featured": True, "description": "Complete timing belt replacement kit including belt, tensioner, and idler pulleys. OEM quality for reliable engine timing."},
            {"title": "Oil Filter – Pack of 6", "price": 24.99, "stock": 300, "condition": "new", "car_make": "Universal", "car_model": "All Models", "car_year": "2010-2024", "category": "engine-parts", "seller": seller2, "description": "Premium synthetic oil filters with anti-drain back valve. Traps 99% of harmful contaminants."},
            {"title": "Remanufactured Turbocharger", "price": 649.00, "stock": 8, "condition": "refurbished", "car_make": "BMW", "car_model": "3 Series", "car_year": "2016-2022", "category": "engine-parts", "seller": seller2, "featured": True, "description": "Factory-remanufactured turbocharger with new wear parts. Includes 1-year warranty. Direct bolt-on replacement."},

            # Brake System
            {"title": "Ceramic Brake Pad Set – Front", "price": 54.99, "stock": 120, "condition": "new", "car_make": "Honda", "car_model": "Civic", "car_year": "2016-2024", "category": "brake-system", "seller": seller1, "featured": True, "description": "Low-dust ceramic brake pads with chamfered edges for quiet, smooth braking. Includes hardware and wear sensors."},
            {"title": "Drilled & Slotted Brake Rotors", "price": 129.99, "stock": 60, "condition": "new", "car_make": "Ford", "car_model": "Mustang", "car_year": "2015-2023", "category": "brake-system", "seller": seller1, "description": "Cross-drilled and slotted rotors for improved heat dissipation and wet-weather performance. Sold as a pair."},
            {"title": "Brake Caliper Assembly", "price": 189.00, "stock": 25, "condition": "refurbished", "car_make": "Chevrolet", "car_model": "Silverado", "car_year": "2014-2022", "category": "brake-system", "seller": seller2, "description": "Remanufactured brake caliper with bracket. Pressure-tested and powder-coated for corrosion resistance."},
            {"title": "DOT 4 Brake Fluid – 1L", "price": 12.99, "stock": 200, "condition": "new", "car_make": "Universal", "car_model": "All Models", "car_year": "All Years", "category": "brake-system", "seller": seller2, "description": "High-performance DOT 4 brake fluid with high boiling point for demanding driving conditions."},

            # Suspension
            {"title": "Front Shock Absorbers – Pair", "price": 159.99, "stock": 40, "condition": "new", "car_make": "Toyota", "car_model": "RAV4", "car_year": "2019-2024", "category": "suspension", "seller": seller1, "featured": True, "description": "Gas-charged twin-tube shock absorbers for a smooth, controlled ride. Direct OEM replacement with no modifications needed."},
            {"title": "Rear Coil Springs Set", "price": 119.00, "stock": 35, "condition": "new", "car_make": "Nissan", "car_model": "Altima", "car_year": "2013-2020", "category": "suspension", "seller": seller2, "description": "Heavy-duty replacement coil springs. Shot-peened and epoxy-coated for long life."},
            {"title": "Lower Control Arm with Ball Joint", "price": 79.99, "stock": 50, "condition": "new", "car_make": "Honda", "car_model": "Accord", "car_year": "2013-2022", "category": "suspension", "seller": seller1, "description": "Complete lower control arm assembly with pre-installed ball joint and bushings. Bolt-on replacement."},

            # Electrical
            {"title": "12V AGM Car Battery", "price": 189.99, "stock": 80, "condition": "new", "car_make": "Universal", "car_model": "All Models", "car_year": "All Years", "category": "electrical", "seller": seller1, "featured": True, "description": "Maintenance-free AGM battery with 850 cold cranking amps. 3-year warranty included."},
            {"title": "LED Headlight Bulbs – H11", "price": 49.99, "stock": 200, "condition": "new", "car_make": "Universal", "car_model": "All Models", "car_year": "2010-2024", "category": "electrical", "seller": seller2, "description": "6500K white LED headlight bulbs with built-in fan cooling. 300% brighter than halogen. Plug-and-play installation."},
            {"title": "Alternator 150A", "price": 229.00, "stock": 20, "condition": "refurbished", "car_make": "Ford", "car_model": "F-150", "car_year": "2015-2023", "category": "electrical", "seller": seller2, "featured": True, "description": "Remanufactured 150-amp alternator with new brushes, bearings, and voltage regulator. Lifetime warranty."},
            {"title": "Ignition Coil Pack", "price": 39.99, "stock": 90, "condition": "new", "car_make": "Hyundai", "car_model": "Elantra", "car_year": "2017-2023", "category": "electrical", "seller": seller1, "description": "Direct ignition coil with integrated igniter. Restores engine performance and fuel efficiency."},

            # Body Parts
            {"title": "Front Bumper Cover – Primed", "price": 279.00, "stock": 15, "condition": "new", "car_make": "Toyota", "car_model": "Corolla", "car_year": "2020-2024", "category": "body-parts", "seller": seller1, "description": "Primed front bumper cover ready for paint. OEM-spec fitment with all mounting points included."},
            {"title": "Side Mirror Assembly – Heated", "price": 89.99, "stock": 40, "condition": "new", "car_make": "Honda", "car_model": "CR-V", "car_year": "2017-2023", "category": "body-parts", "seller": seller2, "description": "Power-adjustable heated side mirror with integrated turn signal. Textured black finish."},
            {"title": "Tail Light Assembly", "price": 64.99, "stock": 55, "condition": "new", "car_make": "Chevrolet", "car_model": "Malibu", "car_year": "2016-2022", "category": "body-parts", "seller": seller1, "featured": True, "description": "DOT/SAE compliant tail light assembly. Includes bulbs and wiring harness. Direct bolt-on replacement."},

            # Interior
            {"title": "All-Weather Floor Mat Set", "price": 59.99, "stock": 100, "condition": "new", "car_make": "Universal", "car_model": "Trim-to-Fit", "car_year": "All Years", "category": "interior", "seller": seller2, "description": "Heavy-duty rubber floor mats with deep channels to trap water, mud, and debris. Set of 4 pieces."},
            {"title": "Leather Steering Wheel Cover", "price": 29.99, "stock": 150, "condition": "new", "car_make": "Universal", "car_model": "All Models", "car_year": "All Years", "category": "interior", "seller": seller1, "description": "Genuine leather steering wheel cover with anti-slip grip. Easy lace-on installation. Fits 14.5–15 inch steering wheels."},

            # Exhaust System
            {"title": "Stainless Steel Cat-Back Exhaust", "price": 449.00, "stock": 12, "condition": "new", "car_make": "Subaru", "car_model": "WRX", "car_year": "2015-2021", "category": "exhaust-system", "seller": seller2, "featured": True, "description": "T304 stainless steel cat-back exhaust system with polished tip. Adds 10-15 HP and delivers an aggressive exhaust note."},
            {"title": "Catalytic Converter – Direct Fit", "price": 329.00, "stock": 18, "condition": "new", "car_make": "Toyota", "car_model": "Camry", "car_year": "2012-2017", "category": "exhaust-system", "seller": seller1, "description": "EPA-compliant direct-fit catalytic converter. Includes gaskets and hardware. No welding required."},
            {"title": "Flex Pipe Repair Kit", "price": 44.99, "stock": 75, "condition": "new", "car_make": "Universal", "car_model": "All Models", "car_year": "All Years", "category": "exhaust-system", "seller": seller2, "description": "Stainless steel flex pipe repair coupling with clamps. Fits 2-inch to 2.5-inch exhaust pipes."},

            # Transmission
            {"title": "Automatic Transmission Filter Kit", "price": 34.99, "stock": 65, "condition": "new", "car_make": "Nissan", "car_model": "Rogue", "car_year": "2014-2023", "category": "transmission", "seller": seller1, "description": "Transmission filter and gasket kit for smooth shifting and extended transmission life. Includes pan gasket."},
            {"title": "Performance Clutch Kit", "price": 259.00, "stock": 15, "condition": "new", "car_make": "Honda", "car_model": "Civic Si", "car_year": "2017-2023", "category": "transmission", "seller": seller2, "featured": True, "description": "Stage 2 performance clutch kit with pressure plate, disc, and release bearing. Handles up to 350 ft-lbs of torque."},
            {"title": "CV Axle Shaft – Front Left", "price": 79.99, "stock": 30, "condition": "new", "car_make": "Mazda", "car_model": "CX-5", "car_year": "2017-2024", "category": "transmission", "seller": seller1, "description": "Premium CV axle shaft with new boots, clamps, and grease. Direct-fit replacement – no modifications needed."},
        ]

        for data in products_data:
            cat_slug = data.pop("category")
            seller = data.pop("seller")
            Product.objects.get_or_create(
                title=data["title"],
                defaults={**data, "category": cats[cat_slug], "seller": seller},
            )

        # ------------------------------------------------------------------
        # Reviews
        # ------------------------------------------------------------------
        products = list(Product.objects.all())
        review_comments = [
            (5, "Excellent quality! Exactly what I needed for my car."),
            (4, "Good product, fast shipping. Would buy again."),
            (5, "Perfect fit, OEM quality at a great price."),
            (3, "Decent product but packaging could be better."),
            (4, "Works great so far. Easy installation."),
        ]

        for i, product in enumerate(products[:15]):
            rating, comment = review_comments[i % len(review_comments)]
            Review.objects.get_or_create(
                product=product,
                user=buyer,
                defaults={"rating": rating, "comment": comment},
            )

        self.stdout.write(self.style.SUCCESS(
            f"✓ Seeding complete: "
            f"{User.objects.count()} users, "
            f"{Category.objects.count()} categories, "
            f"{Product.objects.count()} products, "
            f"{Review.objects.count()} reviews"
        ))
