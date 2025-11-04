import React from "react";
// import { MdOutlineReportProblem } from "react-icons/md";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-60"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      {/* <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"> */}
      <div className="fixed left-1/2 top-24 z-50 w-full max-w-md -translate-x-1/2">
        <div className="relative rounded-lg bg-white shadow-xl">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>

            <p className="mt-2 text-sm text-gray-600">{message}</p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-gray-400 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
                onClick={onConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteConfirmModal;