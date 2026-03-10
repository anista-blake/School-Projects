#This will be for initializing the Flask app.
#Also for registering blueprints and extensions.
def create_app(config_object=None):
    from flask import Flask, url_for
    from .config import Config
    from .extensions import init_extensions
    from .utils import current_user_id, get_user_by_id
    from .auth.create_routes import auth_bp
    from .account.account_routes import account_bp
    from .settings.settings_routes import settings_bp
    from .journal.journal_routes import journal_bp
    from .cycle.cycle_tracker_routes import cycle_bp
    from .main.main_routes import main_bp
    from .reciperoute.routesrecipe import api_bp
    app = Flask(
        __name__,
        template_folder= "templates",  # let blueprints or global project/templates be used
        static_folder= "static",
        static_url_path="/static",
    )

    app.config.from_object(config_object or Config)
    init_extensions(app)
    @app.context_processor
    def inject_user():
        uid = current_user_id()
        if not uid:
            return {"user": None}
        user = get_user_by_id(uid)
        return {"user": user}
    #init_db_collections(app)
    @app.context_processor
    def inject_globals():
        user = get_user_by_id(current_user_id())
        placeholder = url_for("static", filename="img/account-placeholder-image.png")

        avatar_url_header = placeholder
        if user and user.get("avatar_url"):
            v = user.get("avatar_version", 0)
            avatar_url_header = f'{user["avatar_url"]}?v={v}'

        return {"user": user, "avatar_url_header": avatar_url_header}

    #registering blueprints.
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(account_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(journal_bp)
    app.register_blueprint(cycle_bp)
    app.register_blueprint(api_bp)

    return app