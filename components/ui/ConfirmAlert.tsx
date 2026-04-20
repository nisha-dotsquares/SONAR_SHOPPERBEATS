"use client";

import React from "react";

interface ConfirmAlertProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmAlert({
  isOpen,
  title = "Are you sure?",
  message,
  confirmText = "Yes",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmAlertProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h5 className="text-lg font-semibold mb-20">{title}</h5>
        <p className="text-sm text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md border text-sm cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            style={{padding:"0.5rem 1.5rem"}}
            className="rounded-md bg-red-600 text-white text-sm cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
