/**
 * API Keys Management Page
 * Create, view, and revoke API keys
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/packages/ui/button";
import { Plus, Copy, Trash2, Eye, EyeOff, AlertCircle } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function APIKeysPage() {
  const { data: session } = useSession();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState(["read"]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/keys");
      const data = await response.json();
      setKeys(data.keys || []);
    } catch (error) {
      console.error("Error loading API keys:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      alert("Please enter a key name");
      return;
    }

    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName,
          permissions: newKeyPermissions,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCreatedKey(data.key.key);
        setNewKeyName("");
        setNewKeyPermissions(["read"]);
        await loadKeys();
      } else {
        alert(data.error || "Failed to create API key");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      alert("Failed to create API key");
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API key? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/keys?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadKeys();
      } else {
        alert("Failed to revoke API key");
      }
    } catch (error) {
      console.error("Error revoking API key:", error);
      alert("Failed to revoke API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Please sign in to manage API keys</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Keys</h1>
        <p className="text-gray-600">
          Create and manage API keys to access the platform programmatically
        </p>
      </div>

      {/* Alert Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div>
          <h3 className="font-semibold text-yellow-800 mb-1">
            Keep your API keys secure
          </h3>
          <p className="text-sm text-yellow-700">
            API keys provide access to your account. Never share them publicly
            or commit them to version control.
          </p>
        </div>
      </div>

      {/* Create Button */}
      <div className="mb-6">
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New API Key
        </Button>
      </div>

      {/* Created Key Modal */}
      {createdKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">API Key Created</h2>
            <p className="text-sm text-gray-600 mb-4">
              Save this key now - you won&apos;t be able to see it again!
            </p>
            <div className="bg-gray-50 border rounded p-3 mb-4 font-mono text-sm break-all">
              {createdKey}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => copyToClipboard(createdKey)}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Key
              </Button>
              <Button
                variant="outline"
                onClick={() => setCreatedKey(null)}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create API Key</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production Server"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {["read", "write", "admin"].map((perm) => (
                    <label key={perm} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newKeyPermissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKeyPermissions([...newKeyPermissions, perm]);
                          } else {
                            setNewKeyPermissions(
                              newKeyPermissions.filter((p) => p !== perm)
                            );
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm capitalize">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={handleCreateKey} className="flex-1">
                Create Key
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Keys List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <p className="text-gray-500 mb-4">No API keys yet</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First API Key
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{key.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm text-gray-600 font-mono">
                      {key.key}
                    </code>
                    <button
                      onClick={() => copyToClipboard(key.key)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      key.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {key.isActive ? "Active" : "Inactive"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeKey(key.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Permissions:</span>{" "}
                  {key.permissions.join(", ")}
                </div>
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(key.createdAt).toLocaleDateString()}
                </div>
                {key.lastUsedAt && (
                  <div>
                    <span className="font-medium">Last used:</span>{" "}
                    {new Date(key.lastUsedAt).toLocaleDateString()}
                  </div>
                )}
                {key.expiresAt && (
                  <div>
                    <span className="font-medium">Expires:</span>{" "}
                    {new Date(key.expiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documentation */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Using Your API Keys</h2>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold mb-2">Authentication</h3>
            <p className="mb-2">Include your API key in the request header:</p>
            <pre className="bg-white border rounded p-3 overflow-x-auto">
              {`Authorization: Bearer YOUR_API_KEY`}
            </pre>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Example Request</h3>
            <pre className="bg-white border rounded p-3 overflow-x-auto">
              {`curl -X POST https://your-domain.com/api/ai/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Write a blog post"}'`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
