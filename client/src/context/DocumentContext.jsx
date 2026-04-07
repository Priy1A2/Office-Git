import { createContext, useContext, useState, useCallback } from 'react';
import { documentAPI, versionAPI } from '../services/api';

const DocumentContext = createContext(null);

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) throw new Error('useDocuments must be used within DocumentProvider');
  return context;
};

export const DocumentProvider = ({ children }) => {
  const [currentDocument, setCurrentDocument] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [diffVersions, setDiffVersions] = useState({ v1: null, v2: null });
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const fetchDocument = useCallback(async (id) => {
    const { data } = await documentAPI.get(id);
    setCurrentDocument(data.document);
    return data.document;
  }, []);

  const fetchVersions = useCallback(async (documentId, page = 1) => {
    setVersionsLoading(true);
    try {
      const { data } = await versionAPI.list(documentId, page);
      setVersions(data.versions);
      return data;
    } finally {
      setVersionsLoading(false);
    }
  }, []);

  const clearDocument = useCallback(() => {
    setCurrentDocument(null);
    setSelectedVersion(null);
    setVersions([]);
    setDiffVersions({ v1: null, v2: null });
  }, []);

  const selectVersionForDiff = useCallback((version) => {
    setDiffVersions((prev) => {
      if (!prev.v1) return { v1: version, v2: null };
      if (prev.v1._id === version._id) return { v1: null, v2: null };
      if (!prev.v2) return { ...prev, v2: version };
      if (prev.v2._id === version._id) return { ...prev, v2: null };
      return { v1: version, v2: null };
    });
  }, []);

  const clearDiffSelection = useCallback(() => {
    setDiffVersions({ v1: null, v2: null });
  }, []);

  return (
    <DocumentContext.Provider
      value={{
        currentDocument,
        selectedVersion,
        setSelectedVersion,
        diffVersions,
        selectVersionForDiff,
        clearDiffSelection,
        versions,
        versionsLoading,
        fetchDocument,
        fetchVersions,
        clearDocument,
        setCurrentDocument,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};
