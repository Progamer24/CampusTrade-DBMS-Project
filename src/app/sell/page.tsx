"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

type ListingField =
  | "title"
  | "description"
  | "category"
  | "price"
  | "condition"
  | "image";
type ListingErrors = Partial<Record<ListingField, string>>;

function readValue(data: FormData, field: ListingField) {
  return String(data.get(field) ?? "").trim();
}

export default function SellPage() {
  const id = useId();
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState("");
  const [errors, setErrors] = useState<ListingErrors>({});
  const [previewUrl, setPreviewUrl] = useState("");
  const [submittedTitle, setSubmittedTitle] = useState("");
  const readerRef = useRef<FileReader | null>(null);

  useEffect(() => {
    return () => {
      const reader = readerRef.current;
      readerRef.current = null;
      reader?.abort();
    };
  }, []);

  function handleImageChange(file: File | undefined) {
    readerRef.current?.abort();
    readerRef.current = null;
    setImageError("");
    setErrors((current) => ({ ...current, image: "" }));
    setSubmittedTitle("");
    if (!file) {
      setImage(null);
      setPreviewUrl("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setImage(null);
      setPreviewUrl("");
      setImageError("Choose an image file.");
      return;
    }
    setImage(file);
    const reader = new FileReader();
    readerRef.current = reader;
    reader.onload = () => {
      if (readerRef.current !== reader) return;
      readerRef.current = null;
      if (typeof reader.result === "string") setPreviewUrl(reader.result);
    };
    reader.onerror = () => {
      if (readerRef.current !== reader) return;
      readerRef.current = null;
      setImageError("This image could not be previewed. Choose another file.");
      setPreviewUrl("");
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const nextErrors: ListingErrors = {};
    const priceValue = readValue(formData, "price");
    const price = Number(priceValue);

    if (!readValue(formData, "title")) {
      nextErrors.title = "Enter a title for your item.";
    }
    if (!readValue(formData, "description")) {
      nextErrors.description = "Add a short description.";
    }
    if (!readValue(formData, "category")) {
      nextErrors.category = "Choose a category.";
    }
    if (!priceValue) {
      nextErrors.price = "Enter a price.";
    } else if (!Number.isFinite(price) || price <= 0) {
      nextErrors.price = "Enter a price greater than zero.";
    }
    if (!readValue(formData, "condition")) {
      nextErrors.condition = "Choose the item condition.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || imageError) return;

    setSubmittedTitle(readValue(formData, "title"));
    readerRef.current?.abort();
    readerRef.current = null;
    form.reset();
    setImage(null);
    setImageError("");
    setErrors({});
  }

  function clearError(field: ListingField) {
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmittedTitle("");
  }

  function renderError(field: ListingField) {
    return errors[field] ? (
      <span className="field-error" id={`${id}-${field}-error`} role="alert">
        {errors[field]}
      </span>
    ) : null;
  }

  return (
    <>
      <SiteHeader />
      <main className="page-container sell-page">
        <div className="page-intro">
          <div>
            <span className="eyebrow">PASS IT ON · UI PREVIEW</span>
            <h1>List something good.</h1>
            <p>Give a useful campus find its next chapter.</p>
          </div>
          <Link href="/dashboard" className="text-link">
            Go to dashboard
          </Link>
        </div>
        <div className="preview-note" role="note">
          Preview only · Submitting this form does not publish or save a listing.
        </div>

        {submittedTitle && (
          <section className="sell-success" role="status" aria-live="polite">
            <span className="success-mark" aria-hidden="true">
              ✓
            </span>
            <div>
              <h2>Your preview is ready</h2>
              <p>
                “{submittedTitle}” passed the form checks. It has not been
                published or saved to a database.
              </p>
              <div className="success-links">
                <Link href="/">Browse the marketplace</Link>
                <Link href="/dashboard">View dashboard</Link>
              </div>
            </div>
            <button
              className="dismiss-button"
              type="button"
              aria-label="Dismiss preview message"
              onClick={() => setSubmittedTitle("")}
            >
              ×
            </button>
          </section>
        )}

        <form className="listing-form form-card" onSubmit={handleSubmit} noValidate>
          <div className="form-section-heading">
            <span className="eyebrow">ITEM INFORMATION</span>
            <h2>Tell students about your find</h2>
            <p>Required fields are marked with an asterisk.</p>
          </div>

          <div className="form-field">
            <label htmlFor={`${id}-title`}>Item title <span aria-hidden="true">*</span></label>
            <input
              id={`${id}-title`}
              name="title"
              type="text"
              maxLength={100}
              placeholder="e.g. Scientific calculator"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? `${id}-title-error` : undefined}
              onChange={() => clearError("title")}
              required
            />
            {renderError("title")}
          </div>

          <div className="form-field">
            <label htmlFor={`${id}-description`}>Description <span aria-hidden="true">*</span></label>
            <textarea
              id={`${id}-description`}
              name="description"
              rows={5}
              maxLength={1000}
              placeholder="Share useful details about the item and its condition."
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? `${id}-description-error` : undefined
              }
              onChange={() => clearError("description")}
              required
            />
            {renderError("description")}
          </div>

          <div className="form-two-column">
            <div className="form-field">
              <label htmlFor={`${id}-category`}>Category <span aria-hidden="true">*</span></label>
              <select
                id={`${id}-category`}
                name="category"
                defaultValue=""
                aria-invalid={Boolean(errors.category)}
                aria-describedby={
                  errors.category ? `${id}-category-error` : undefined
                }
                onChange={() => clearError("category")}
                required
              >
                <option value="" disabled>
                  Select a category
                </option>
                <option value="Books">Books</option>
                <option value="Electronics">Electronics</option>
                <option value="Accessories">Accessories</option>
                <option value="Other">Other</option>
              </select>
              {renderError("category")}
            </div>
            <div className="form-field">
              <label htmlFor={`${id}-price`}>Price (₹) <span aria-hidden="true">*</span></label>
              <input
                id={`${id}-price`}
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                placeholder="e.g. 250"
                aria-invalid={Boolean(errors.price)}
                aria-describedby={errors.price ? `${id}-price-error` : undefined}
                onChange={() => clearError("price")}
                required
              />
              {renderError("price")}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor={`${id}-condition`}>Condition <span aria-hidden="true">*</span></label>
            <select
              id={`${id}-condition`}
              name="condition"
              defaultValue=""
              aria-invalid={Boolean(errors.condition)}
              aria-describedby={
                errors.condition ? `${id}-condition-error` : undefined
              }
              onChange={() => clearError("condition")}
              required
            >
              <option value="" disabled>
                Select the item condition
              </option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
            {renderError("condition")}
          </div>

          <div className="form-field">
            <label htmlFor={`${id}-image`}>
              Item image <span className="optional-label">Optional</span>
            </label>
            <input
              id={`${id}-image`}
              name="image"
              type="file"
              accept="image/*"
              aria-invalid={Boolean(imageError || errors.image)}
              aria-describedby={
                imageError || errors.image
                  ? `${id}-image-error`
                  : `${id}-image-hint`
              }
              onChange={(event) =>
                handleImageChange(event.currentTarget.files?.[0])
              }
            />
            <span className="field-hint" id={`${id}-image-hint`}>
              Select an image to preview it here. The file is not uploaded.
            </span>
            {(imageError || errors.image) && (
              <span
                className="field-error"
                id={`${id}-image-error`}
                role="alert"
              >
                {imageError || errors.image}
              </span>
            )}
            {image && (
              <div className="image-preview">
                {previewUrl && (
                  <>
                    {/* The selected local file is previewed only; it is never uploaded. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt={`Preview of ${image.name}`} />
                  </>
                )}
                <span>{image.name} · Local preview</span>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => handleImageChange(undefined)}
                >
                  Remove image
                </button>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button className="button button-dark" type="submit">
              Preview listing <span aria-hidden="true">↗</span>
            </button>
            <p>Nothing will be published or saved.</p>
          </div>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
