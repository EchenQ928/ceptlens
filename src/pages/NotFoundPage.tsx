import { Link } from "react-router-dom";
import { useCopy } from "../i18n";

export function NotFoundPage() {
  const copy = useCopy();
  return (
    <div className="empty-state">
      <h1>{copy("notFoundTitle")}</h1>
      <p>{copy("notFoundDescription")}</p>
      <Link className="button button-primary" to="/">
        {copy("returnOverview")}
      </Link>
    </div>
  );
}
