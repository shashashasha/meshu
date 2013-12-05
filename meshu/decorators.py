from functools import wraps

class persist_session_vars(object):
    """ Some views, such as login and logout, will reset all session state.
    However, we occasionally want to persist some of those session variables.
    """

    session_backup = {}

    def __init__(self, vars):
        self.vars = vars

    def __enter__(self):
        for var in self.vars:
            self.session_backup[var] = self.request.session.get(var)

    def __exit__(self, exc_type, exc_value, traceback):
        for var in self.vars:
            self.request.session[var] = self.session_backup.get(var)

    def __call__(self, test_func, *args, **kwargs):

        @wraps(test_func)
        def inner(*args, **kwargs):
            if not args:
                raise Exception('Must decorate a view, ie a function taking request as the first parameter')
            self.request = args[0]
            with self:
                return test_func(*args, **kwargs)

        return inner