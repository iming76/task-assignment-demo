import { useEffect, type ReactNode } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useHistory } from "@docusaurus/router";

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const history = useHistory();

  useEffect(() => {
    history.replace("/docs");
  }, [history]);

  return <p>Redirecting to {siteConfig.title} docs…</p>;
}
