import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { toast } from "react-hot-toast";
import { Upload, File, AlertCircle } from "lucide-react";
import { flags } from "../lib/flags.js";
import type { ApiFile } from "../types/api.js";

interface UploaderProps {
  onUploadSuccess: (file: ApiFile) => void;
  onUploadError?: (error: string) => void;
}

export const Uploader: React.FC<UploaderProps> = ({
  onUploadSuccess,
  onUploadError,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    ".ifc",
    ".dwg",
    ".rvt",
    ".step",
    ".obj",
    ".gltf",
    ".glb",
  ];

  const uploadMutation = useMutation({
    mutationFn: api.uploadFile,
    onSuccess: (file: ApiFile) => {
      toast.success("File uploaded successfully");
      onUploadSuccess(file);
    },
    onError: (error: any) => {
      const message = error?.error || "Upload failed";
      toast.error(message);
      onUploadError?.(message);
    },
  });

  const handleFile = async (file: File) => {
    if (!allowedTypes.some((type) => file.name.toLowerCase().endsWith(type))) {
      const message = `Invalid file type. Allowed: ${allowedTypes.join(", ")}`;
      toast.error(message);
      onUploadError?.(message);
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      // 100MB
      const message = "File too large. Maximum size is 100MB";
      toast.error(message);
      onUploadError?.(message);
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
          dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
        } ${uploadMutation.isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={allowedTypes.join(",")}
          onChange={handleChange}
          disabled={uploadMutation.isPending}
        />

        <div className="space-y-2">
          {uploadMutation.isPending ? (
            <div className="mx-auto h-12 w-12 text-blue-600">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
          )}

          <div className="text-sm text-gray-600">
            {uploadMutation.isPending ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" />
                Uploading...
              </span>
            ) : (
              <>
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Click to upload
                </span>{" "}
                or drag and drop
              </>
            )}
          </div>

          <p className="text-xs text-gray-500">
            {allowedTypes.join(", ").toUpperCase()} files up to 100MB
          </p>
        </div>
      </div>

      {uploadMutation.error && (
        <div className="mt-4 flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{(uploadMutation.error as any)?.error || "Upload failed"}</span>
        </div>
      )}

      {flags.debug.enabled && uploadMutation.error && (
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer">
            Debug Info
          </summary>
          <pre className="mt-1 text-xs text-gray-400 bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(uploadMutation.error, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};
