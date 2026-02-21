import React from "react";
import { IncidentList } from "./IncidentList";

/**
 * On réutilise IncidentList
 * mais on lui passe un mode "archives"
 */
export const Archives: React.FC = () => {
  return <IncidentList mode="archives" />;
};