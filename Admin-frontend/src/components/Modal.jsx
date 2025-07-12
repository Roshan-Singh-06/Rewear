import React, { useEffect, useState, useCallback, useRef } from "react";

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(31, 41, 55, 0.5);
    border-radius: 10px;
    margin: 6px 0;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #5BC0BE;
    border-radius: 10px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #6FFFE9;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
`;

const Modal = ({ isOpen, onClose, children, maxWidth = "max-w-lg" }) => {
  const [animation, setAnimation] = useState(false);
  const [backdropAnimation, setBackdropAnimation] = useState(false);
  const modalContentRef = useRef(null);

  const handleClose = useCallback(() => {
    setBackdropAnimation(false);
    setAnimation(false);
    // Delay actual closing to allow animation to complete
    setTimeout(() => onClose(), 300);
  }, [onClose]);

  // Handle click outside modal
  const handleBackdropClick = useCallback(
    (event) => {
      // Only close if clicking the backdrop, not the modal content
      if (
        modalContentRef.current &&
        !modalContentRef.current.contains(event.target)
      ) {
        handleClose();
      }
    },
    [handleClose]
  );

  useEffect(() => {
    if (isOpen) {
      // Add a new history entry when modal opens
      window.history.pushState({ modal: true }, "");

      // Staggered animations for smoother effect
      // First trigger backdrop animation
      requestAnimationFrame(() => {
        setBackdropAnimation(true);
        // Then trigger modal content animation slightly after
        setTimeout(() => setAnimation(true), 50);
      });

      // Handle back button navigation
      const handlePopState = () => {
        handleClose();
      };

      // Add event listener for ESC key
      const handleEscKey = (event) => {
        if (event.key === "Escape") {
          handleClose();
        }
      };

      window.addEventListener("popstate", handlePopState);
      document.addEventListener("keydown", handleEscKey);

      // Clean up event listeners when modal closes
      return () => {
        window.removeEventListener("popstate", handlePopState);
        document.removeEventListener("keydown", handleEscKey);
      };
    } else {
      setBackdropAnimation(false);
      setAnimation(false);
    }
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Add custom scrollbar styles */}
      <style>{scrollbarStyles}</style>

      <div
        className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-300 ease-out ${
          backdropAnimation
            ? "backdrop-blur-md bg-black/40"
            : "backdrop-blur-none bg-black/0"
        }`}
        onClick={handleBackdropClick}
      >
        <div
          ref={modalContentRef}
          className={`bg-gray-900/90 rounded-xl ${maxWidth} w-full relative border border-gray-700 shadow-xl transition-all duration-300 ease-out overflow-hidden ${
            animation ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-white z-10"
            onClick={handleClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="custom-scrollbar max-h-[80vh] overflow-y-auto p-6 pr-5">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
