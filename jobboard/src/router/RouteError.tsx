import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

const RouteError = () => {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-4xl mb-3">{notFound ? '🔍' : '⚠️'}</p>
        <h1 className="text-2xl font-bold text-ink mb-2">
          {notFound ? 'Page not found' : 'Something went wrong'}
        </h1>
        <p className="text-ink/60 mb-6">
          {notFound
            ? "We couldn't find the page you were looking for."
            : 'The site may have been updated while you were browsing. Reloading usually fixes it.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          {!notFound && (
            <button onClick={() => window.location.reload()}
              className="bg-evergreen hover:bg-evergreen-dark text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
              Reload
            </button>
          )}
          <Link to="/"
            className="border border-evergreen text-evergreen hover:bg-evergreen/5 font-bold px-5 py-2.5 rounded-xl transition-colors">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RouteError;