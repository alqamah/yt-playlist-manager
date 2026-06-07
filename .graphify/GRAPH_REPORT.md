# Graph Report - .  (2026-06-07)

## Corpus Check
- Corpus is ~16,571 words - fits in a single context window. You may not need a graph.

## Summary
- 53 nodes · 64 edges · 10 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 39 · imports_from: 13 · imports: 10 · calls: 2


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 28 · Candidates: 46
- Excluded: 0 untracked · 41067 ignored · 0 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `a19d2b1`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `getOAuth2Client()` - 4 edges
2. `getAuthorizationUrl()` - 3 edges
3. `getYouTubeClient()` - 3 edges
4. `IUser` - 2 edges
5. `authRouter` - 2 edges
6. `categoriesRouter` - 2 edges
7. `playlistsRouter` - 2 edges
8. `Playlist` - 2 edges
9. `Category` - 2 edges
10. `useStore` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.23
Nodes (10): IUser, UserSchema, authUrl, oauth2, oauth2Client, SessionData, state, getAuthorizationUrl() (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.27
Nodes (6): Category, Playlist, PlaylistItem, StoreState, UserProfile, useStore

### Community 2 - "Community 2"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 3 - "Community 3"
Cohesion: 0.40
Nodes (4): IPlaylist, IPlaylistItem, PlaylistItemSchema, PlaylistSchema

### Community 4 - "Community 4"
Cohesion: 0.50
Nodes (2): categoriesRouter, newCategory

### Community 5 - "Community 5"
Cohesion: 0.50
Nodes (1): playlistsRouter

### Community 6 - "Community 6"
Cohesion: 0.67
Nodes (2): authRouter, app

### Community 7 - "Community 7"
Cohesion: 0.67
Nodes (2): CategorySchema, ICategory

### Community 9 - "Community 9"
Cohesion: 1.00
Nodes (1): eslintConfig

### Community 10 - "Community 10"
Cohesion: 1.00
Nodes (1): nextConfig

## Knowledge Gaps
- **22 isolated node(s):** `app`, `ICategory`, `CategorySchema`, `IPlaylistItem`, `IPlaylist` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 4`** (2 nodes): `categoriesRouter`, `newCategory`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 5`** (1 nodes): `playlistsRouter`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (2 nodes): `authRouter`, `app`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (2 nodes): `CategorySchema`, `ICategory`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (1 nodes): `eslintConfig`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (1 nodes): `nextConfig`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getYouTubeClient()` connect `Community 0` to `Community 5`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `app`, `ICategory`, `CategorySchema` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._