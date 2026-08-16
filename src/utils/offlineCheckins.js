import { supabase } from "../supabaseClient";

const DB_NAME = "meetoutdoors-offline";
const DB_VERSION = 1;
const STORE_NAME = "pending-checkins";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(
        request.error ||
          new Error("IndexedDB nije dostupan.")
      );
    };

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(
          STORE_NAME,
          {
            keyPath: "local_id",
          }
        );

        store.createIndex(
          "user_id",
          "user_id",
          {
            unique: false,
          }
        );

        store.createIndex(
          "place_id",
          "place_id",
          {
            unique: false,
          }
        );

        store.createIndex(
          "created_at",
          "created_at",
          {
            unique: false,
          }
        );
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function transactionPromise(mode, callback) {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(
          STORE_NAME,
          mode
        );

        const store =
          transaction.objectStore(STORE_NAME);

        let result;

        try {
          result = callback(store);
        } catch (error) {
          reject(error);
          return;
        }

        transaction.oncomplete = () => {
          db.close();
          resolve(result);
        };

        transaction.onerror = () => {
          db.close();

          reject(
            transaction.error ||
              new Error(
                "Offline baza nije dostupna."
              )
          );
        };

        transaction.onabort = () => {
          db.close();

          reject(
            transaction.error ||
              new Error(
                "Offline transakcija je prekinuta."
              )
          );
        };
      })
  );
}

export async function queueOfflineCheckin({
  userId,
  placeId,
  latitude,
  longitude,
  accuracy,
  deviceTimestamp,
  visibility = "public",
  caption = null,
}) {
  const item = {
    local_id: crypto.randomUUID(),

    user_id: userId,

    place_id: placeId,

    latitude,

    longitude,

    accuracy_m: accuracy ?? null,

    device_timestamp:
      deviceTimestamp ||
      new Date().toISOString(),

    visibility,

    caption,

    created_at: new Date().toISOString(),

    sync_attempts: 0,

    last_error: null,
  };

  await transactionPromise(
    "readwrite",
    (store) => {
      store.put(item);
    }
  );

  return item;
}

export async function getPendingCheckins(
  userId
) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readonly"
    );

    const store =
      transaction.objectStore(STORE_NAME);

    const request = userId
      ? store
          .index("user_id")
          .getAll(userId)
      : store.getAll();

    request.onsuccess = () => {
      const items = request.result || [];

      items.sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );

      db.close();

      resolve(items);
    };

    request.onerror = () => {
      db.close();

      reject(
        request.error ||
          new Error(
            "Pending check-inovi nisu dostupni."
          )
      );
    };
  });
}

export async function removePendingCheckin(
  localId
) {
  await transactionPromise(
    "readwrite",
    (store) => {
      store.delete(localId);
    }
  );
}

export async function updatePendingCheckin(
  item
) {
  await transactionPromise(
    "readwrite",
    (store) => {
      store.put(item);
    }
  );
}

export async function syncPendingCheckins(
  userId
) {
  if (!navigator.onLine || !userId) {
    return {
      synced: 0,
      failed: 0,
      remaining: (
        await getPendingCheckins(userId)
      ).length,
    };
  }

  const items =
    await getPendingCheckins(userId);

  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const { error } =
        await supabase.rpc(
          "create_verified_checkin",
          {
            p_place_id:
              item.place_id,

            p_latitude:
              item.latitude,

            p_longitude:
              item.longitude,

            p_accuracy_m:
              item.accuracy_m,

            p_caption:
              item.caption,

            p_visibility:
              item.visibility,

            p_device_timestamp:
              item.device_timestamp,
          }
        );

      if (error) throw error;

      await removePendingCheckin(
        item.local_id
      );

      synced += 1;
    } catch (error) {
      failed += 1;

      await updatePendingCheckin({
        ...item,

        sync_attempts:
          Number(
            item.sync_attempts || 0
          ) + 1,

        last_error:
          error?.message ||
          "Automatska sinhronizacija nije uspela.",

        last_attempt_at:
          new Date().toISOString(),
      });
    }
  }

  const remaining = (
    await getPendingCheckins(userId)
  ).length;

  return {
    synced,
    failed,
    remaining,
  };
}