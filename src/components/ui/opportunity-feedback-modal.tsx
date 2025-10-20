"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OpportunityFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: string;
  opportunityType: 'internal' | 'external';
  opportunityTitle: string;
}

const MISMATCH_TYPES = [
  { value: 'degree', label: 'Degree/Major Requirement', description: 'Required a different major than mine' },
  { value: 'experience', label: 'Experience Requirement', description: 'Required more years of experience' },
  { value: 'skill', label: 'Skill Requirement', description: 'Required specific skills I don\'t have' },
  { value: 'location', label: 'Location Mismatch', description: 'Not available in my location' },
  { value: 'eligibility', label: 'Eligibility Requirement', description: 'Age, citizenship, or other eligibility criteria' },
  { value: 'other', label: 'Other', description: 'Something else didn\'t match' },
];

export function OpportunityFeedbackModal({
  isOpen,
  onClose,
  opportunityId,
  opportunityType,
  opportunityTitle,
}: OpportunityFeedbackModalProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [mismatchDetails, setMismatchDetails] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/opportunities/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId,
          opportunityType,
          mismatchType: selectedType,
          mismatchDetails,
          additionalComments,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedType('');
    setMismatchDetails('');
    setAdditionalComments('');
    setSubmitted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-bidaaya-dark border border-bidaaya-light/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-bidaaya-light/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-400" />
            <h2 className="text-lg font-semibold text-bidaaya-light">Report Mismatch</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-bidaaya-light hover:bg-bidaaya-light/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {submitted ? (
          /* Success State */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-bidaaya-light mb-2">Thank You!</h3>
            <p className="text-bidaaya-light/60">
              Your feedback helps us improve our matching algorithm.
            </p>
          </div>
        ) : (
          /* Form */
          <div className="p-6 space-y-6">
            {/* Opportunity Info */}
            <div className="bg-bidaaya-light/5 rounded-lg p-4">
              <p className="text-xs text-bidaaya-light/60 mb-1">Opportunity</p>
              <p className="text-sm font-medium text-bidaaya-light">{opportunityTitle}</p>
            </div>

            {/* Mismatch Type Selection */}
            <div>
              <label className="block text-sm font-medium text-bidaaya-light mb-3">
                What didn't match? *
              </label>
              <div className="space-y-2">
                {MISMATCH_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border transition-all",
                      selectedType === type.value
                        ? "border-bidaaya-accent bg-bidaaya-accent/10"
                        : "border-bidaaya-light/10 bg-bidaaya-light/5 hover:border-bidaaya-light/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all",
                        selectedType === type.value
                          ? "border-bidaaya-accent bg-bidaaya-accent"
                          : "border-bidaaya-light/30"
                      )}>
                        {selectedType === type.value && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-bidaaya-light">{type.label}</p>
                        <p className="text-xs text-bidaaya-light/60 mt-0.5">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Specific Details */}
            {selectedType && (
              <div>
                <label className="block text-sm font-medium text-bidaaya-light mb-2">
                  Can you provide more details?
                </label>
                <input
                  type="text"
                  value={mismatchDetails}
                  onChange={(e) => setMismatchDetails(e.target.value)}
                  placeholder="e.g., Required 2+ years Python, I have 6 months"
                  className="w-full bg-bidaaya-light/5 border border-bidaaya-light/10 rounded-lg px-4 py-3 text-sm text-bidaaya-light placeholder:text-bidaaya-light/40 focus:outline-none focus:border-bidaaya-accent"
                />
              </div>
            )}

            {/* Additional Comments */}
            <div>
              <label className="block text-sm font-medium text-bidaaya-light mb-2">
                Additional comments (optional)
              </label>
              <textarea
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                placeholder="Any other feedback about this match?"
                rows={3}
                className="w-full bg-bidaaya-light/5 border border-bidaaya-light/10 rounded-lg px-4 py-3 text-sm text-bidaaya-light placeholder:text-bidaaya-light/40 focus:outline-none focus:border-bidaaya-accent resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-bidaaya-light/20 text-bidaaya-light hover:bg-bidaaya-light/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedType || isSubmitting}
                className="flex-1 bg-bidaaya-accent hover:bg-bidaaya-accent/90"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

