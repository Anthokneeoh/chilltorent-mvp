import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines and merges Tailwind CSS classes safely without duplication conflicts.
 * Crucial for multi-variant UI component style overriding injections.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Formats standard numbers into localized Nigerian Naira (NGN).
 * Strips fractional decimal kobo values for real-world real estate utility.
 */
export function formatNaira(amount: number | bigint): string {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Transforms property system token types into clean, human-readable Nigerian market titles.
 */
export function formatPropertyType(type: "flat" | "bungalow" | "duplex" | "room" | "self_contain" | "studio"): string {
    const mapping: Record<typeof type, string> = {
        flat: "Flat / Apartment",
        bungalow: "Bungalow",
        duplex: "Duplex House",
        room: "Single Room",
        self_contain: "Self-Contained Apartment",
        studio: "Studio Apartment",
    };
    return mapping[type] || type;
}

/**
 * Translates NERC power bands into clear infrastructure explanations for renters.
 */
export function formatElectricityBand(band: "A" | "B" | "C" | "D" | "E"): string {
    const mapping: Record<typeof band, string> = {
        A: "Band A (20+ Hours/Day)",
        B: "Band B (16-20 Hours/Day)",
        C: "Band C (12-16 Hours/Day)",
        D: "Band D (8-12 Hours/Day)",
        E: "Band E (4-8 Hours/Day)",
    };
    return mapping[band] || `Band ${band}`;
}

/**
 * Formats water supply assets to reflect standard neighborhood utilities.
 */
export function formatWaterSource(source: "borehole" | "mains" | "well"): string {
    const mapping: Record<typeof source, string> = {
        borehole: "Borehole Supply",
        mains: "Public Water Mains",
        well: "Well Water",
    };
    return mapping[source] || source;
}

/**
 * Humanizes security infrastructure evaluations for properties.
 */
export function formatSecurityRating(rating: "estate_security" | "street_gate" | "none"): string {
    const mapping: Record<typeof rating, string> = {
        estate_security: "Estate Uniformed Security",
        street_gate: "Gated Street / Community Guard",
        none: "No Dedicated Security",
    };
    return mapping[rating] || rating;
}

/**
 * Formats local access road metrics cleanly for search lists.
 */
export function formatRoadCondition(condition: "tarred" | "interlocked" | "untarred"): string {
    const mapping: Record<typeof condition, string> = {
        tarred: "Tarred Road",
        interlocked: "Interlocked Road",
        untarred: "Untarred Road",
    };
    return mapping[condition] || condition;
}

/**
 * Normalizes system tracking states into polished corporate workflow badges.
 */
export function formatListingStatus(status: "PENDING_PAYMENT" | "PENDING_APPROVAL" | "ACTIVE" | "RENTED" | "OFFLINE"): string {
    const mapping: Record<typeof status, string> = {
        PENDING_PAYMENT: "Pending Payment",
        PENDING_APPROVAL: "Pending Verification",
        ACTIVE: "Live Listing",
        RENTED: "Rented Out",
        OFFLINE: "Offline / Archived",
    };
    return mapping[status] || status;
}

/**
 * Formats date signatures into a clean local display standard ("16 May, 2026").
 */
export function formatDate(date: Date | string): string {
    const targetDate = typeof date === "string" ? new Date(date) : date;
    return targetDate.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/**
 * Generates relative temporal timestamps ("2 mins ago", "3 days ago") for messaging and notification feeds.
 */
export function timeAgo(date: Date | string): string {
    const targetDate = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} year${interval === 1 ? "" : "s"} ago`;

    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} month${interval === 1 ? "" : "s"} ago`;

    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} day${interval === 1 ? "" : "s"} ago`;

    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} hour${interval === 1 ? "" : "s"} ago`;

    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} minute${interval === 1 ? "" : "s"} ago`;

    return "just now";
}

/**
 * Truncates excessive text metadata gracefully with trailing ellipses markers.
 */
export function truncateText(text: string, maximumLength: number): string {
    if (text.length <= maximumLength) return text;
    return text.slice(0, maximumLength) + "...";
}

/**
 * Validates native Nigerian telephone dial structures against provider routing boundaries.
 * Supports standard local formats: 080..., 081..., 090..., 070..., 091...
 */
export function isValidNigerianPhone(phone: string): boolean {
    const cleanString = phone.replace(/\D/g, "");
    return /^(080|081|090|070|091)[0-9]{8}$/.test(cleanString);
}

/**
 * Generates cryptography-safe randomized 6-digit verification numbers for SMS/Email validation routing.
 */
export function generateSystemOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validates target user video files against strict MVP platform length bounds (Capped at 30 seconds).
 */
export function validateVideoDuration(file: File, maximumDurationSeconds = 30): Promise<boolean> {
    return new Promise((resolve) => {
        const videoElement = document.createElement("video");
        videoElement.preload = "metadata";
        videoElement.onloadedmetadata = () => {
            window.URL.revokeObjectURL(videoElement.src);
            resolve(videoElement.duration <= maximumDurationSeconds);
        };
        videoElement.onerror = () => {
            resolve(false);
        };
        videoElement.src = URL.createObjectURL(file);
    });
}