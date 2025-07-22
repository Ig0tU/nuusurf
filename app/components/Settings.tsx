import { useState } from "react";

export default function Settings({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [provider, setProvider] = useState(
    localStorage.getItem("model_provider") || "google"
  );
  const [googleApiKey, setGoogleApiKey] = useState(
    localStorage.getItem("google_api_key") || ""
  );
  const [ollamaApiUrl, setOllamaApiUrl] = useState(
    localStorage.getItem("ollama_api_url") || "http://localhost:11434/v1"
  );

  const handleSave = () => {
    localStorage.setItem("model_provider", provider);
    localStorage.setItem("google_api_key", googleApiKey);
    localStorage.setItem("ollama_api_url", ollamaApiUrl);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Settings
        </h3>
        <div className="mt-2">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Model Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="google">Google</option>
              <option value="ollama">Ollama</option>
            </select>
          </div>
          {provider === "google" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Google API Key
              </label>
              <input
                type="text"
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          )}
          {provider === "ollama" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Ollama API URL
              </label>
              <input
                type="text"
                value={ollamaApiUrl}
                onChange={(e) => setOllamaApiUrl(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          )}
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
