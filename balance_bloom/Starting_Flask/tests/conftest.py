# tests/conftest.py
import pytest
import os, sys, types

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# make sure create_app / Config sees a MONGO_URI value if it checks env
os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017/test_db")
os.environ.setdefault("MONGO_DBNAME", "balance_bloom_test")

# optional: if mongomock is not installed, `pip install mongomock`
import mongomock

# Build a fake module to satisfy `from bloom.extensions import init_extensions`
fake_ext = types.ModuleType("bloom.extensions")

def init_extensions(app):
    # create a mongomock client and attach as module globals similar to real impl
    fake_ext._client = mongomock.MongoClient()
    fake_ext._db = fake_ext._client[app.config.get("MONGO_DBNAME", "balance_bloom")]

def get_db():
    if getattr(fake_ext, "_db", None) is None:
        raise RuntimeError("Database not initialized. Call init_extensions(app) from create_app().")
    return fake_ext._db

fake_ext.init_extensions = init_extensions
fake_ext.get_db = get_db

# Insert into sys.modules so "from bloom.extensions import ..." picks this up
sys.modules["bloom.extensions"] = fake_ext
from bloom import create_app
import bloom.account.account_routes as account_routes  # module that defines the view + account_bp
import bloom.auth.create_routes as create_routes  # module that defines the view + account_bp

@pytest.fixture
def app():
    app = create_app()

    app.config.update({
        "TESTING": True,
        "WTF_CSRF_ENABLED": False,
        "SECRET_KEY": "test-secret",
        # no need to set MONGO_URI here because conftest set it for Config; you can include it if you want
    })
    # If the factory didn't register the account blueprint, register it here.
    # We check whether the rule exists already to avoid double registration.
    try:
        import bloom.main.main_routes as main_routes
        m_bp = getattr(main_routes, "main_bp", None)
        if m_bp and m_bp.name not in app.blueprints:
            app.register_blueprint(m_bp)
    except Exception:
        # ignore if main module not present for these tests
        pass

    try:
        import bloom.account.account_routes as account_routes
        acc_bp = getattr(account_routes, "account_bp", None)
        if acc_bp and acc_bp.name not in app.blueprints:
            app.register_blueprint(acc_bp)
    except Exception:
        pass

    try:
        import bloom.auth.create_routes as create_routes
        auth_bp = getattr(create_routes, "auth_bp", None)
        # Register auth_bp without a url_prefix so routes like "/login" resolve as in your app
        if auth_bp and auth_bp.name not in app.blueprints:
            app.register_blueprint(auth_bp)
    except Exception:
        pass

    yield app


@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def db():
    """Return the mongomock database instance used by the fake bloom.extensions."""
    return fake_ext._db