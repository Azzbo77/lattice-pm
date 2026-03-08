// ── UIContext ─────────────────────────────────────────────────────────────────
// Owns: tab, filters, all modal state, all confirm state

import {
  createContext, useState, useContext, ReactNode,
} from "react";
import type { Task, Project, Supplier, Part, BomRow, User } from "../types";

export interface UIContextType {
  // Navigation
  tab:        string;
  pf:         string;
  bomFilter:  string;
  taskFilter: string;
  setTab:       (tab: string) => void;
  setPf:        (pf: string) => void;
  setBomFilter: (f: string) => void;
  setTaskFilter:(f: string) => void;
  // Modals
  taskModal:     Task | null | Record<string, unknown>;
  projectModal:  Project | null | Record<string, unknown>;
  supplierModal: Supplier | null | Record<string, unknown>;
  orderModal:    string | null;
  partModal:     { supplierId: string; part: Partial<Part> } | null;
  bomModal:      { entry: BomRow | null; partId: string; supplierId: string } | null;
  memberModal:   User | null | Record<string, unknown>;
  showSummary:   boolean;
  setTaskModal:     (m: Task | null | Record<string, unknown>) => void;
  setProjectModal:  (m: Project | null | Record<string, unknown>) => void;
  setSupplierModal: (m: Supplier | null | Record<string, unknown>) => void;
  setOrderModal:    (m: string | null) => void;
  setPartModal:     (m: { supplierId: string; part: Partial<Part> } | null) => void;
  setBomModal:      (m: { entry: BomRow | null; partId: string; supplierId: string } | null) => void;
  setMemberModal:   (m: User | null | Record<string, unknown>) => void;
  setShowSummary:   (v: boolean) => void;
  // Confirm dialogs
  confirmRemove:             { userId: string; name: string } | null;
  confirmDeleteBom:          string | null;
  confirmDeleteProject:      Project | null;
  confirmDeleteAnnouncement: string | null;
  setConfirmRemove:             (m: { userId: string; name: string } | null) => void;
  setConfirmDeleteBom:          (id: string | null) => void;
  setConfirmDeleteProject:      (m: Project | null) => void;
  setConfirmDeleteAnnouncement: (id: string | null) => void;
}

export const UIContext = createContext<UIContextType | null>(null);

export const useUI = (): UIContextType => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside UIProvider");
  return ctx;
};

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [tab,        setTab]        = useState("dashboard");
  const [pf,         setPf]         = useState("all");
  const [bomFilter,  setBomFilter]  = useState("all");
  const [taskFilter, setTaskFilter] = useState("all");

  const [taskModal,     setTaskModal]     = useState<Task | null | Record<string, unknown>>(null);
  const [projectModal,  setProjectModal]  = useState<Project | null | Record<string, unknown>>(null);
  const [supplierModal, setSupplierModal] = useState<Supplier | null | Record<string, unknown>>(null);
  const [orderModal,    setOrderModal]    = useState<string | null>(null);
  const [partModal,     setPartModal]     = useState<{ supplierId: string; part: Partial<Part> } | null>(null);
  const [bomModal,      setBomModal]      = useState<{ entry: BomRow | null; partId: string; supplierId: string } | null>(null);
  const [memberModal,   setMemberModal]   = useState<User | null | Record<string, unknown>>(null);
  const [showSummary,   setShowSummary]   = useState(false);

  const [confirmRemove,             setConfirmRemove]             = useState<{ userId: string; name: string } | null>(null);
  const [confirmDeleteBom,          setConfirmDeleteBom]          = useState<string | null>(null);
  const [confirmDeleteProject,      setConfirmDeleteProject]      = useState<Project | null>(null);
  const [confirmDeleteAnnouncement, setConfirmDeleteAnnouncement] = useState<string | null>(null);

  return (
    <UIContext.Provider value={{
      tab, pf, bomFilter, taskFilter,
      setTab, setPf, setBomFilter, setTaskFilter,
      taskModal, projectModal, supplierModal, orderModal, partModal,
      bomModal, memberModal, showSummary,
      setTaskModal, setProjectModal, setSupplierModal, setOrderModal,
      setPartModal, setBomModal, setMemberModal, setShowSummary,
      confirmRemove, confirmDeleteBom, confirmDeleteProject, confirmDeleteAnnouncement,
      setConfirmRemove, setConfirmDeleteBom, setConfirmDeleteProject, setConfirmDeleteAnnouncement,
    }}>
      {children}
    </UIContext.Provider>
  );
};
