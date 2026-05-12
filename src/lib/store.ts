import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SearchFilters } from "@/types";

export interface PublishedProperty {
  id: string;
  title: string;
  description: string;
  type: string;
  transactionType: "rent" | "sale";
  status: "active" | "paused";
  price: number;
  pricePeriod: "month" | "year" | "total";
  surface?: number;
  rooms?: number;
  bathrooms?: number;
  furnished: boolean;
  availableNow: boolean;
  neighborhood: string;
  city: string;
  images: { id: string; url: string; alt: string; isPrimary: boolean }[];
  owner: {
    id: string; name: string; phone: string; whatsapp?: string;
    email: string; role: string; verified: boolean; badges: []; trustScore: number;
    createdAt: string;
  };
  badges: [];
  views: number;
  whatsappClicks: number;
  isBoosted: boolean;
  boostExpiry?: string;
  createdAt: string;
  updatedAt: string;
  features: string[];
}

interface NotificationItem {
  id: string;
  message: string;
  type: "success" | "info" | "warning";
  read: boolean;
  createdAt: string;
}

interface SavedSearch {
  id: string;
  label: string;
  filters: Record<string, string>;
  savedAt: string;
}

export interface FavoriteCollection {
  id: string;
  name: string;
  propertyIds: string[];
  createdAt: string;
  color: string;
}

export interface PriceAlert {
  id: string;
  propertyId: string;
  originalPrice: number;
  alertedAt: string;
}

export interface OwnerReview {
  id: string;
  ownerId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  sentAt: string;
}

export interface Conversation {
  id: string;
  propertyId: string;
  propertyTitle: string;
  participantName: string;
  participantAvatar: string;
  participantPhone: string;
  messages: ChatMessage[];
  lastRead: string;
}


interface AppState {
  // Theme
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;

  // Language
  lang: "fr" | "en";
  setLang: (lang: "fr" | "en") => void;

  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  // Favorites
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;

  // Search
  lastFilters: SearchFilters;
  setLastFilters: (filters: SearchFilters) => void;

  // Recent views
  recentViews: string[];
  addRecentView: (id: string) => void;
  clearRecentViews: () => void;

  // Compare
  compareList: string[];
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;

  // Notifications
  notifications: NotificationItem[];
  addNotification: (message: string, type: "success" | "info" | "warning") => void;
  markAllRead: () => void;
  unreadCount: () => number;

  // Saved searches
  savedSearches: SavedSearch[];
  saveSearch: (label: string, filters: Record<string, string>) => void;
  removeSavedSearch: (id: string) => void;

  // User-published listings
  publishedListings: PublishedProperty[];
  addPublishedListing: (p: PublishedProperty) => void;
  removePublishedListing: (id: string) => void;
  updateListingStatus: (id: string, status: "active" | "paused") => void;
  updatePublishedListing: (id: string, partial: Partial<PublishedProperty>) => void;
  duplicateListing: (id: string) => void;
  boostListing: (id: string, durationDays?: number) => void;

  // Favorite collections
  favoriteCollections: FavoriteCollection[];
  createCollection: (name: string, color: string) => string;
  addToCollection: (collectionId: string, propertyId: string) => void;
  removeFromCollection: (collectionId: string, propertyId: string) => void;
  deleteCollection: (id: string) => void;
  renameCollection: (id: string, name: string) => void;

  // Price alerts
  priceAlerts: PriceAlert[];
  addPriceAlert: (propertyId: string, price: number) => void;
  removePriceAlert: (propertyId: string) => void;
  hasPriceAlert: (propertyId: string) => boolean;

  // Owner reviews
  ownerReviews: OwnerReview[];
  addOwnerReview: (review: Omit<OwnerReview, "id" | "createdAt">) => void;
  getOwnerReviews: (ownerId: string) => OwnerReview[];

  // Conversations / Chat
  conversations: Conversation[];
  sendMessage: (conversationId: string, text: string) => void;
  markConversationRead: (conversationId: string) => void;
  unreadMessages: () => number;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      setTheme: (theme) => set({ theme }),

      lang: "fr",
      setLang: (lang) => set({ lang }),

      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      favorites: [],
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id],
        })),
      isFavorite: (id) => get().favorites.includes(id),

      lastFilters: {},
      setLastFilters: (filters) => set({ lastFilters: filters }),

      recentViews: [],
      addRecentView: (id) =>
        set((s) => ({
          recentViews: [id, ...s.recentViews.filter((v) => v !== id)].slice(0, 10),
        })),
      clearRecentViews: () => set({ recentViews: [] }),

      compareList: [],
      addToCompare: (id) =>
        set((s) => ({
          compareList: s.compareList.includes(id) || s.compareList.length >= 3
            ? s.compareList
            : [...s.compareList, id],
        })),
      removeFromCompare: (id) =>
        set((s) => ({ compareList: s.compareList.filter((c) => c !== id) })),
      clearCompare: () => set({ compareList: [] }),

      notifications: [
        {
          id: "n1",
          message: "Nouvelle annonce dans votre quartier favori : Kipé",
          type: "info",
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "n2",
          message: "Votre annonce sauvegardée a baissé de prix !",
          type: "success",
          read: false,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "n3",
          message: "Rappel : Visite programmée demain à 10h00",
          type: "warning",
          read: true,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ],
      addNotification: (message, type) =>
        set((s) => ({
          notifications: [
            {
              id: String(Date.now()),
              message,
              type,
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...s.notifications,
          ],
        })),
      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      unreadCount: () => get().notifications.filter((n) => !n.read).length,

      savedSearches: [],
      saveSearch: (label, filters) =>
        set((s) => ({
          savedSearches: [
            {
              id: String(Date.now()),
              label,
              filters,
              savedAt: new Date().toISOString(),
            },
            ...s.savedSearches,
          ],
        })),
      removeSavedSearch: (id) =>
        set((s) => ({
          savedSearches: s.savedSearches.filter((ss) => ss.id !== id),
        })),

      publishedListings: [],
      addPublishedListing: (p) =>
        set((s) => ({ publishedListings: [p, ...s.publishedListings] })),
      removePublishedListing: (id) =>
        set((s) => ({ publishedListings: s.publishedListings.filter((p) => p.id !== id) })),
      updateListingStatus: (id, status) =>
        set((s) => ({
          publishedListings: s.publishedListings.map((p) =>
            p.id === id ? { ...p, status } : p
          ),
        })),
      updatePublishedListing: (id, partial) =>
        set((s) => ({
          publishedListings: s.publishedListings.map((p) =>
            p.id === id ? { ...p, ...partial, updatedAt: new Date().toISOString() } : p
          ),
        })),
      duplicateListing: (id) =>
        set((s) => {
          const original = s.publishedListings.find((p) => p.id === id);
          if (!original) return {};
          const copy: PublishedProperty = {
            ...original,
            id: `user-${Date.now()}`,
            title: `${original.title} (copie)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            views: 0,
            whatsappClicks: 0,
            isBoosted: false,
            boostExpiry: undefined,
          };
          return { publishedListings: [copy, ...s.publishedListings] };
        }),
      boostListing: (id, durationDays = 7) =>
        set((s) => {
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + durationDays);
          const notification: NotificationItem = {
            id: String(Date.now()),
            message: "Votre annonce est maintenant mise en avant !",
            type: "success",
            read: false,
            createdAt: new Date().toISOString(),
          };
          return {
            publishedListings: s.publishedListings.map((p) =>
              p.id === id
                ? { ...p, isBoosted: true, boostExpiry: expiry.toISOString() }
                : p
            ),
            notifications: [notification, ...s.notifications],
          };
        }),

      // Favorite collections
      favoriteCollections: [
        {
          id: "col-1",
          name: "Appartements",
          propertyIds: ["prop-001", "prop-002"],
          createdAt: new Date().toISOString(),
          color: "#F97316",
        },
        {
          id: "col-2",
          name: "Pour la famille",
          propertyIds: ["prop-004"],
          createdAt: new Date().toISOString(),
          color: "#22c55e",
        },
      ],
      createCollection: (name, color) => {
        const id = `col-${Date.now()}`;
        set((s) => ({
          favoriteCollections: [
            ...s.favoriteCollections,
            { id, name, propertyIds: [], createdAt: new Date().toISOString(), color },
          ],
        }));
        return id;
      },
      addToCollection: (collectionId, propertyId) =>
        set((s) => ({
          favoriteCollections: s.favoriteCollections.map((c) =>
            c.id === collectionId && !c.propertyIds.includes(propertyId)
              ? { ...c, propertyIds: [...c.propertyIds, propertyId] }
              : c
          ),
        })),
      removeFromCollection: (collectionId, propertyId) =>
        set((s) => ({
          favoriteCollections: s.favoriteCollections.map((c) =>
            c.id === collectionId
              ? { ...c, propertyIds: c.propertyIds.filter((pid) => pid !== propertyId) }
              : c
          ),
        })),
      deleteCollection: (id) =>
        set((s) => ({
          favoriteCollections: s.favoriteCollections.filter((c) => c.id !== id),
        })),
      renameCollection: (id, name) =>
        set((s) => ({
          favoriteCollections: s.favoriteCollections.map((c) =>
            c.id === id ? { ...c, name } : c
          ),
        })),

      // Price alerts
      priceAlerts: [],
      addPriceAlert: (propertyId, price) =>
        set((s) => ({
          priceAlerts: [
            ...s.priceAlerts.filter((a) => a.propertyId !== propertyId),
            {
              id: String(Date.now()),
              propertyId,
              originalPrice: price,
              alertedAt: new Date().toISOString(),
            },
          ],
        })),
      removePriceAlert: (propertyId) =>
        set((s) => ({
          priceAlerts: s.priceAlerts.filter((a) => a.propertyId !== propertyId),
        })),
      hasPriceAlert: (propertyId) =>
        get().priceAlerts.some((a) => a.propertyId === propertyId),

      // Owner reviews — seeded with 3 mock reviews for owner "user-001"
      ownerReviews: [
        {
          id: "or1",
          ownerId: "user-001",
          authorName: "Aminata Balde",
          rating: 5,
          comment: "Propriétaire très réactif, logement conforme aux photos. Je recommande vivement !",
          createdAt: "2026-03-15T10:00:00.000Z",
        },
        {
          id: "or2",
          ownerId: "user-001",
          authorName: "Moussa Kouyaté",
          rating: 4,
          comment: "Bonne expérience, quelques petites réparations à faire mais le propriétaire a été à l'écoute.",
          createdAt: "2026-02-08T14:30:00.000Z",
        },
        {
          id: "or3",
          ownerId: "user-001",
          authorName: "Fatoumata Diallo",
          rating: 5,
          comment: "Excellent ! Logement propre, bien situé. Le propriétaire est honnête et professionnel.",
          createdAt: "2026-01-20T09:00:00.000Z",
        },
      ],
      addOwnerReview: (review) =>
        set((s) => ({
          ownerReviews: [
            {
              ...review,
              id: `or-${Date.now()}`,
              createdAt: new Date().toISOString(),
            },
            ...s.ownerReviews,
          ],
        })),
      getOwnerReviews: (ownerId) =>
        get().ownerReviews.filter((r) => r.ownerId === ownerId),

      // Conversations / Chat
      conversations: [],
      sendMessage: (conversationId, text) => {
        const now = new Date().toISOString();
        const newMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          from: "me",
          text,
          sentAt: now,
        };
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, newMsg], lastRead: now }
              : c
          ),
        }));
      },
      markConversationRead: (conversationId) => {
        const now = new Date().toISOString();
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, lastRead: now } : c
          ),
        }));
      },
      unreadMessages: () => {
        return get().conversations.reduce((total, conv) => {
          const unread = conv.messages.filter(
            (m) => m.from === "them" && m.sentAt > conv.lastRead
          ).length;
          return total + unread;
        }, 0);
      },
    }),
    {
      name: "guimmo-store",
      partialize: (s) => ({
        theme: s.theme,
        lang: s.lang,
        favorites: s.favorites,
        lastFilters: s.lastFilters,
        recentViews: s.recentViews,
        notifications: s.notifications,
        savedSearches: s.savedSearches,
        publishedListings: s.publishedListings,
        favoriteCollections: s.favoriteCollections,
        priceAlerts: s.priceAlerts,
        ownerReviews: s.ownerReviews,
        conversations: s.conversations,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
