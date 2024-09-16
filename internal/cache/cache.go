// Package cache provides abstraction of cache implementations that can be used by zitadel.
package cache

import (
	"context"
)

// Cache stores objects with a value of type `V`.
// Objects may be referred to by one or more indices.
//
// `I` is the type by which indices are identified,
// typically an enum for type-safe access.
// Indices are defined when calling the constructor of an implementation of this interface.
// It is illegal to refer to an idex not defined during construction.
//
// `K` is the type used as key in each index.
// Due to the limitations in type constraints, all indices use the same key type.
//
// Implementations are free to use stricter type constraints or fixed typing.
type Cache[I, K comparable, V any] interface {
	// Get an object through specified index.
	// An [IndexUnknownError] may be returned if the index is unknown.
	// [ErrCacheMiss] is returned if the key was not found in the index,
	// or the object is not valid.
	Get(ctx context.Context, index I, key K) (V, error)

	// Set an object.
	// Keys are created on each index based in the [Entry.Keys] method.
	// If any key maps to an existing object, the object is invalidated,
	// regardless if the object has other keys defined in the new entry.
	// This to prevent ghost objects when an entry reduces the amount of keys
	// for a given index.
	Set(ctx context.Context, entry Entry[I, K, V]) error

	// Invalidate an object through specified index.
	// Implementations may choose to instantly delete the object,
	// defer until prune or a separate cleanup routine.
	// Invalidated object are no longer returned from Get.
	// It is safe to call Invalidate multiple times or on non-existing entries.
	Invalidate(ctx context.Context, index I, key ...K) error

	// Delete one or more keys from a specific index.
	// An [IndexUnknownError] may be returned if the index is unknown.
	// The referred object is not invalidated and may still be accessible though
	// other indices and keys.
	// It is safe to call Delete multiple times or on non-existing entries
	Delete(ctx context.Context, index I, key ...K) error

	// Prune deletes all invalidated or expired objects.
	Prune(ctx context.Context) error

	// Clear deletes all cached objects.
	Clear(ctx context.Context) error

	// Close the cache. Subsequent calls to the cache are not allowed.
	Close(ctx context.Context) error
}

// Entry contains a value of type `V` to be cached.
//
// `I` is the type by which indices are identified,
// typically an enum for type-safe access.
//
// `K` is the type used as key in an index.
// Due to the limitations in type constraints, all indices use the same key type.
type Entry[I, K comparable, V any] interface {
	// Keys returns which keys map to the object in a specified index.
	// May return nil if the index in unknown or when there are no keys.
	Keys(index I) (key []K)

	// Value of the object which is cached.
	// [Cache] implementations may encode the value for storage.
	// This means non-exported fields may be lost and objects
	// with function values may fail to encode.
	// See https://pkg.go.dev/encoding/json#Marshal for example.
	Value() V
}
