/**
 * Graph Data Structures and Algorithms
 * @module utils/graph
 * @description Graph utilities including directed/undirected graphs,
 * traversal algorithms, shortest path, and topological sorting.
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Graph edge with weight
 */
export interface Edge<T = string> {
  from: T;
  to: T;
  weight?: number;
}

/**
 * Graph traversal options
 */
export interface TraversalOptions<T> {
  /** Starting node */
  start: T;
  /** Callback for each visited node */
  visit?: (node: T, depth: number) => void | boolean;
  /** Maximum depth to traverse */
  maxDepth?: number;
}

/**
 * Shortest path result
 */
export interface ShortestPathResult<T> {
  path: T[];
  distance: number;
  found: boolean;
}

/**
 * Graph statistics
 */
export interface GraphStats {
  nodes: number;
  edges: number;
  directed: boolean;
  density: number;
  averageDegree: number;
}

// ============================================================================
// Graph Class
// ============================================================================

/**
 * Graph data structure supporting both directed and undirected graphs
 */
export class Graph<T = string> {
  private adjacencyList = new Map<T, Map<T, number>>();
  private isDirected: boolean;

  constructor(directed = false) {
    this.isDirected = directed;
  }

  /**
   * Get all nodes
   */
  get nodes(): T[] {
    return Array.from(this.adjacencyList.keys());
  }

  /**
   * Get all edges
   */
  get edges(): Edge<T>[] {
    const edges: Edge<T>[] = [];
    const seen = new Set<string>();

    for (const [from, neighbors] of this.adjacencyList) {
      for (const [to, weight] of neighbors) {
        const key = this.isDirected
          ? `${String(from)}->${String(to)}`
          : [String(from), String(to)].sort().join('<->');

        if (!seen.has(key)) {
          seen.add(key);
          edges.push({ from, to, weight });
        }
      }
    }

    return edges;
  }

  /**
   * Get number of nodes
   */
  get size(): number {
    return this.adjacencyList.size;
  }

  /**
   * Check if graph is directed
   */
  get directed(): boolean {
    return this.isDirected;
  }

  /**
   * Add a node
   */
  addNode(node: T): void {
    if (!this.adjacencyList.has(node)) {
      this.adjacencyList.set(node, new Map());
    }
  }

  /**
   * Remove a node and all its edges
   */
  removeNode(node: T): boolean {
    if (!this.adjacencyList.has(node)) return false;

    // Remove all edges to this node
    for (const neighbors of this.adjacencyList.values()) {
      neighbors.delete(node);
    }

    // Remove the node
    this.adjacencyList.delete(node);
    return true;
  }

  /**
   * Check if node exists
   */
  hasNode(node: T): boolean {
    return this.adjacencyList.has(node);
  }

  /**
   * Add an edge
   */
  addEdge(from: T, to: T, weight = 1): void {
    this.addNode(from);
    this.addNode(to);

    this.adjacencyList.get(from)!.set(to, weight);

    if (!this.isDirected) {
      this.adjacencyList.get(to)!.set(from, weight);
    }
  }

  /**
   * Remove an edge
   */
  removeEdge(from: T, to: T): boolean {
    const fromNeighbors = this.adjacencyList.get(from);
    if (!fromNeighbors) return false;

    const removed = fromNeighbors.delete(to);

    if (!this.isDirected && removed) {
      this.adjacencyList.get(to)?.delete(from);
    }

    return removed;
  }

  /**
   * Check if edge exists
   */
  hasEdge(from: T, to: T): boolean {
    return this.adjacencyList.get(from)?.has(to) ?? false;
  }

  /**
   * Get edge weight
   */
  getWeight(from: T, to: T): number | undefined {
    return this.adjacencyList.get(from)?.get(to);
  }

  /**
   * Set edge weight
   */
  setWeight(from: T, to: T, weight: number): boolean {
    const fromNeighbors = this.adjacencyList.get(from);
    if (!fromNeighbors?.has(to)) return false;

    fromNeighbors.set(to, weight);

    if (!this.isDirected) {
      this.adjacencyList.get(to)?.set(from, weight);
    }

    return true;
  }

  /**
   * Get neighbors of a node
   */
  getNeighbors(node: T): T[] {
    return Array.from(this.adjacencyList.get(node)?.keys() ?? []);
  }

  /**
   * Get degree of a node (number of edges)
   */
  getDegree(node: T): number {
    if (this.isDirected) {
      return this.getOutDegree(node) + this.getInDegree(node);
    }
    return this.adjacencyList.get(node)?.size ?? 0;
  }

  /**
   * Get out-degree (directed graphs)
   */
  getOutDegree(node: T): number {
    return this.adjacencyList.get(node)?.size ?? 0;
  }

  /**
   * Get in-degree (directed graphs)
   */
  getInDegree(node: T): number {
    let count = 0;
    for (const [, neighbors] of this.adjacencyList) {
      if (neighbors.has(node)) count++;
    }
    return count;
  }

  /**
   * Clear all nodes and edges
   */
  clear(): void {
    this.adjacencyList.clear();
  }

  /**
   * Clone the graph
   */
  clone(): Graph<T> {
    const newGraph = new Graph<T>(this.isDirected);

    for (const [node, neighbors] of this.adjacencyList) {
      newGraph.adjacencyList.set(node, new Map(neighbors));
    }

    return newGraph;
  }

  /**
   * Get graph statistics
   */
  getStats(): GraphStats {
    const nodes = this.size;
    const edges = this.edges.length;
    const maxEdges = this.isDirected
      ? nodes * (nodes - 1)
      : (nodes * (nodes - 1)) / 2;

    return {
      nodes,
      edges,
      directed: this.isDirected,
      density: maxEdges > 0 ? edges / maxEdges : 0,
      averageDegree:
        nodes > 0 ? (edges * (this.isDirected ? 1 : 2)) / nodes : 0,
    };
  }

  // ============================================================================
  // Traversal Algorithms
  // ============================================================================

  /**
   * Breadth-First Search
   */
  bfs(options: TraversalOptions<T>): T[] {
    const { start, visit, maxDepth = Infinity } = options;
    const visited = new Set<T>();
    const result: T[] = [];
    const queue: Array<{ node: T; depth: number }> = [
      { node: start, depth: 0 },
    ];

    while (queue.length > 0) {
      const { node, depth } = queue.shift()!;

      if (visited.has(node) || depth > maxDepth) continue;
      visited.add(node);
      result.push(node);

      if (visit?.(node, depth) === false) break;

      const neighbors = this.getNeighbors(node);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({ node: neighbor, depth: depth + 1 });
        }
      }
    }

    return result;
  }

  /**
   * Depth-First Search
   */
  dfs(options: TraversalOptions<T>): T[] {
    const { start, visit, maxDepth = Infinity } = options;
    const visited = new Set<T>();
    const result: T[] = [];

    const traverse = (node: T, depth: number): boolean => {
      if (visited.has(node) || depth > maxDepth) return true;
      visited.add(node);
      result.push(node);

      if (visit?.(node, depth) === false) return false;

      const neighbors = this.getNeighbors(node);
      for (const neighbor of neighbors) {
        if (!traverse(neighbor, depth + 1)) return false;
      }

      return true;
    };

    traverse(start, 0);
    return result;
  }

  /**
   * Iterative Depth-First Search (non-recursive)
   */
  dfsIterative(options: TraversalOptions<T>): T[] {
    const { start, visit, maxDepth = Infinity } = options;
    const visited = new Set<T>();
    const result: T[] = [];
    const stack: Array<{ node: T; depth: number }> = [
      { node: start, depth: 0 },
    ];

    while (stack.length > 0) {
      const { node, depth } = stack.pop()!;

      if (visited.has(node) || depth > maxDepth) continue;
      visited.add(node);
      result.push(node);

      if (visit?.(node, depth) === false) break;

      const neighbors = this.getNeighbors(node);
      for (let i = neighbors.length - 1; i >= 0; i--) {
        if (!visited.has(neighbors[i])) {
          stack.push({ node: neighbors[i], depth: depth + 1 });
        }
      }
    }

    return result;
  }

  // ============================================================================
  // Path Finding
  // ============================================================================

  /**
   * Dijkstra's shortest path algorithm
   */
  dijkstra(start: T, end: T): ShortestPathResult<T> {
    if (!this.hasNode(start) || !this.hasNode(end)) {
      return { path: [], distance: Infinity, found: false };
    }

    const distances = new Map<T, number>();
    const previous = new Map<T, T | null>();
    const unvisited = new Set<T>(this.nodes);

    // Initialize distances
    for (const node of this.nodes) {
      distances.set(node, node === start ? 0 : Infinity);
      previous.set(node, null);
    }

    while (unvisited.size > 0) {
      // Find minimum distance unvisited node
      let current: T | null = null;
      let minDist = Infinity;

      for (const node of unvisited) {
        const dist = distances.get(node)!;
        if (dist < minDist) {
          minDist = dist;
          current = node;
        }
      }

      if (current === null || minDist === Infinity) break;
      if (current === end) break;

      unvisited.delete(current);

      // Update neighbors
      const neighbors = this.adjacencyList.get(current)!;
      for (const [neighbor, weight] of neighbors) {
        if (!unvisited.has(neighbor)) continue;

        const newDist = distances.get(current)! + weight;
        if (newDist < distances.get(neighbor)!) {
          distances.set(neighbor, newDist);
          previous.set(neighbor, current);
        }
      }
    }

    // Reconstruct path
    const path: T[] = [];
    let current: T | null = end;

    while (current !== null) {
      path.unshift(current);
      current = previous.get(current) ?? null;
    }

    const distance = distances.get(end)!;
    const found = distance !== Infinity;

    return {
      path: found ? path : [],
      distance,
      found,
    };
  }

  /**
   * Bellman-Ford shortest path (handles negative weights)
   */
  bellmanFord(start: T): Map<T, { distance: number; path: T[] }> | null {
    const distances = new Map<T, number>();
    const previous = new Map<T, T | null>();

    // Initialize
    for (const node of this.nodes) {
      distances.set(node, node === start ? 0 : Infinity);
      previous.set(node, null);
    }

    // Relax edges V-1 times
    const edges = this.edges;
    for (let i = 0; i < this.size - 1; i++) {
      for (const edge of edges) {
        const distFrom = distances.get(edge.from)!;
        const distTo = distances.get(edge.to)!;
        const newDist = distFrom + (edge.weight ?? 1);

        if (distFrom !== Infinity && newDist < distTo) {
          distances.set(edge.to, newDist);
          previous.set(edge.to, edge.from);
        }
      }
    }

    // Check for negative cycles
    for (const edge of edges) {
      const distFrom = distances.get(edge.from)!;
      const distTo = distances.get(edge.to)!;

      if (distFrom !== Infinity && distFrom + (edge.weight ?? 1) < distTo) {
        // Negative cycle detected
        return null;
      }
    }

    // Build results
    const results = new Map<T, { distance: number; path: T[] }>();

    for (const node of this.nodes) {
      const path: T[] = [];
      let current: T | null = node;

      while (current !== null) {
        path.unshift(current);
        current = previous.get(current) ?? null;
      }

      results.set(node, {
        distance: distances.get(node)!,
        path: distances.get(node) !== Infinity ? path : [],
      });
    }

    return results;
  }

  /**
   * Find all paths between two nodes
   */
  findAllPaths(start: T, end: T, maxLength = 10): T[][] {
    const paths: T[][] = [];
    const currentPath: T[] = [start];

    const dfs = (node: T): void => {
      if (currentPath.length > maxLength) return;

      if (node === end) {
        paths.push([...currentPath]);
        return;
      }

      for (const neighbor of this.getNeighbors(node)) {
        if (!currentPath.includes(neighbor)) {
          currentPath.push(neighbor);
          dfs(neighbor);
          currentPath.pop();
        }
      }
    };

    if (this.hasNode(start)) {
      dfs(start);
    }

    return paths;
  }

  // ============================================================================
  // Graph Analysis
  // ============================================================================

  /**
   * Topological sort (directed acyclic graphs only)
   */
  topologicalSort(): T[] | null {
    if (!this.isDirected) {
      throw new Error('Topological sort requires a directed graph');
    }

    const inDegree = new Map<T, number>();
    const result: T[] = [];

    // Initialize in-degrees
    for (const node of this.nodes) {
      inDegree.set(node, 0);
    }

    for (const [, neighbors] of this.adjacencyList) {
      for (const neighbor of neighbors.keys()) {
        inDegree.set(neighbor, (inDegree.get(neighbor) ?? 0) + 1);
      }
    }

    // Find nodes with no incoming edges
    const queue: T[] = [];
    for (const [node, degree] of inDegree) {
      if (degree === 0) queue.push(node);
    }

    while (queue.length > 0) {
      const node = queue.shift()!;
      result.push(node);

      for (const neighbor of this.getNeighbors(node)) {
        const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }

    // Check for cycle
    if (result.length !== this.size) {
      return null; // Graph has a cycle
    }

    return result;
  }

  /**
   * Detect if graph has a cycle
   */
  hasCycle(): boolean {
    if (this.isDirected) {
      return this.topologicalSort() === null;
    }

    // Undirected graph cycle detection using DFS
    const visited = new Set<T>();
    const parent = new Map<T, T | null>();

    const hasCycleDFS = (node: T, p: T | null): boolean => {
      visited.add(node);
      parent.set(node, p);

      for (const neighbor of this.getNeighbors(node)) {
        if (!visited.has(neighbor)) {
          if (hasCycleDFS(neighbor, node)) return true;
        } else if (neighbor !== p) {
          return true;
        }
      }

      return false;
    };

    for (const node of this.nodes) {
      if (!visited.has(node)) {
        if (hasCycleDFS(node, null)) return true;
      }
    }

    return false;
  }

  /**
   * Find connected components (undirected graphs)
   */
  getConnectedComponents(): T[][] {
    if (this.isDirected) {
      throw new Error('Connected components require an undirected graph');
    }

    const visited = new Set<T>();
    const components: T[][] = [];

    for (const node of this.nodes) {
      if (!visited.has(node)) {
        const component = this.bfs({ start: node });
        component.forEach(n => visited.add(n));
        components.push(component);
      }
    }

    return components;
  }

  /**
   * Find strongly connected components (directed graphs)
   * Using Kosaraju's algorithm
   */
  getStronglyConnectedComponents(): T[][] {
    if (!this.isDirected) {
      throw new Error('Strongly connected components require a directed graph');
    }

    // First DFS to get finish order
    const visited = new Set<T>();
    const finishOrder: T[] = [];

    const dfs1 = (node: T): void => {
      visited.add(node);
      for (const neighbor of this.getNeighbors(node)) {
        if (!visited.has(neighbor)) dfs1(neighbor);
      }
      finishOrder.push(node);
    };

    for (const node of this.nodes) {
      if (!visited.has(node)) dfs1(node);
    }

    // Build transpose graph
    const transpose = new Graph<T>(true);
    for (const node of this.nodes) {
      transpose.addNode(node);
    }
    for (const edge of this.edges) {
      transpose.addEdge(edge.to, edge.from, edge.weight);
    }

    // Second DFS on transpose in reverse finish order
    visited.clear();
    const components: T[][] = [];

    const dfs2 = (node: T, component: T[]): void => {
      visited.add(node);
      component.push(node);
      for (const neighbor of transpose.getNeighbors(node)) {
        if (!visited.has(neighbor)) dfs2(neighbor, component);
      }
    };

    while (finishOrder.length > 0) {
      const node = finishOrder.pop()!;
      if (!visited.has(node)) {
        const component: T[] = [];
        dfs2(node, component);
        components.push(component);
      }
    }

    return components;
  }

  /**
   * Check if graph is bipartite
   */
  isBipartite(): boolean {
    const color = new Map<T, number>();

    const bfs = (start: T): boolean => {
      const queue: T[] = [start];
      color.set(start, 0);

      while (queue.length > 0) {
        const node = queue.shift()!;
        const nodeColor = color.get(node)!;

        for (const neighbor of this.getNeighbors(node)) {
          if (!color.has(neighbor)) {
            color.set(neighbor, 1 - nodeColor);
            queue.push(neighbor);
          } else if (color.get(neighbor) === nodeColor) {
            return false;
          }
        }
      }

      return true;
    };

    for (const node of this.nodes) {
      if (!color.has(node)) {
        if (!bfs(node)) return false;
      }
    }

    return true;
  }

  /**
   * Get articulation points (cut vertices)
   */
  getArticulationPoints(): T[] {
    if (this.isDirected) {
      throw new Error('Articulation points require an undirected graph');
    }

    const visited = new Set<T>();
    const disc = new Map<T, number>();
    const low = new Map<T, number>();
    const parent = new Map<T, T | null>();
    const ap = new Set<T>();
    let time = 0;

    const dfs = (node: T): void => {
      let children = 0;
      visited.add(node);
      disc.set(node, time);
      low.set(node, time);
      time++;

      for (const neighbor of this.getNeighbors(node)) {
        if (!visited.has(neighbor)) {
          children++;
          parent.set(neighbor, node);
          dfs(neighbor);

          low.set(node, Math.min(low.get(node)!, low.get(neighbor)!));

          // Node is articulation point if:
          // 1. It's root of DFS tree and has 2+ children
          // 2. It's not root and low value of one child >= discovery of node
          const isRoot = parent.get(node) === null;
          if (isRoot && children > 1) {
            ap.add(node);
          }
          if (!isRoot && low.get(neighbor)! >= disc.get(node)!) {
            ap.add(node);
          }
        } else if (neighbor !== parent.get(node)) {
          low.set(node, Math.min(low.get(node)!, disc.get(neighbor)!));
        }
      }
    };

    for (const node of this.nodes) {
      if (!visited.has(node)) {
        parent.set(node, null);
        dfs(node);
      }
    }

    return Array.from(ap);
  }

  /**
   * Find bridges (cut edges)
   */
  getBridges(): Edge<T>[] {
    if (this.isDirected) {
      throw new Error('Bridges require an undirected graph');
    }

    const visited = new Set<T>();
    const disc = new Map<T, number>();
    const low = new Map<T, number>();
    const parent = new Map<T, T | null>();
    const bridges: Edge<T>[] = [];
    let time = 0;

    const dfs = (node: T): void => {
      visited.add(node);
      disc.set(node, time);
      low.set(node, time);
      time++;

      for (const neighbor of this.getNeighbors(node)) {
        if (!visited.has(neighbor)) {
          parent.set(neighbor, node);
          dfs(neighbor);

          low.set(node, Math.min(low.get(node)!, low.get(neighbor)!));

          if (low.get(neighbor)! > disc.get(node)!) {
            bridges.push({
              from: node,
              to: neighbor,
              weight: this.getWeight(node, neighbor),
            });
          }
        } else if (neighbor !== parent.get(node)) {
          low.set(node, Math.min(low.get(node)!, disc.get(neighbor)!));
        }
      }
    };

    for (const node of this.nodes) {
      if (!visited.has(node)) {
        parent.set(node, null);
        dfs(node);
      }
    }

    return bridges;
  }

  // ============================================================================
  // Minimum Spanning Tree
  // ============================================================================

  /**
   * Kruskal's MST algorithm
   */
  kruskalMST(): { edges: Edge<T>[]; weight: number } | null {
    if (this.isDirected) {
      throw new Error('MST requires an undirected graph');
    }

    // Union-Find data structure
    const parent = new Map<T, T>();
    const rank = new Map<T, number>();

    const find = (node: T): T => {
      if (parent.get(node) !== node) {
        parent.set(node, find(parent.get(node)!));
      }
      return parent.get(node)!;
    };

    const union = (a: T, b: T): boolean => {
      const rootA = find(a);
      const rootB = find(b);

      if (rootA === rootB) return false;

      const rankA = rank.get(rootA)!;
      const rankB = rank.get(rootB)!;

      if (rankA < rankB) {
        parent.set(rootA, rootB);
      } else if (rankA > rankB) {
        parent.set(rootB, rootA);
      } else {
        parent.set(rootB, rootA);
        rank.set(rootA, rankA + 1);
      }

      return true;
    };

    // Initialize Union-Find
    for (const node of this.nodes) {
      parent.set(node, node);
      rank.set(node, 0);
    }

    // Sort edges by weight
    const sortedEdges = [...this.edges].sort(
      (a, b) => (a.weight ?? 1) - (b.weight ?? 1)
    );

    const mstEdges: Edge<T>[] = [];
    let totalWeight = 0;

    for (const edge of sortedEdges) {
      if (union(edge.from, edge.to)) {
        mstEdges.push(edge);
        totalWeight += edge.weight ?? 1;

        if (mstEdges.length === this.size - 1) break;
      }
    }

    // Check if MST was found (graph is connected)
    if (mstEdges.length !== this.size - 1) {
      return null;
    }

    return { edges: mstEdges, weight: totalWeight };
  }

  /**
   * Prim's MST algorithm
   */
  primMST(start?: T): { edges: Edge<T>[]; weight: number } | null {
    if (this.isDirected) {
      throw new Error('MST requires an undirected graph');
    }

    if (this.size === 0) return null;

    const startNode = start ?? this.nodes[0];
    const visited = new Set<T>([startNode]);
    const mstEdges: Edge<T>[] = [];
    let totalWeight = 0;

    // Priority queue simulation with array
    const candidates: Array<{ from: T; to: T; weight: number }> = [];

    // Add initial edges
    for (const [neighbor, weight] of this.adjacencyList.get(startNode)!) {
      candidates.push({ from: startNode, to: neighbor, weight });
    }

    while (visited.size < this.size && candidates.length > 0) {
      // Find minimum weight edge
      candidates.sort((a, b) => a.weight - b.weight);

      let edge: { from: T; to: T; weight: number } | undefined;
      while (candidates.length > 0) {
        edge = candidates.shift()!;
        if (!visited.has(edge.to)) break;
        edge = undefined;
      }

      if (!edge) break;

      visited.add(edge.to);
      mstEdges.push({ from: edge.from, to: edge.to, weight: edge.weight });
      totalWeight += edge.weight;

      // Add new candidate edges
      for (const [neighbor, weight] of this.adjacencyList.get(edge.to)!) {
        if (!visited.has(neighbor)) {
          candidates.push({ from: edge.to, to: neighbor, weight });
        }
      }
    }

    if (mstEdges.length !== this.size - 1) {
      return null;
    }

    return { edges: mstEdges, weight: totalWeight };
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Convert to adjacency matrix
   */
  toAdjacencyMatrix(): { nodes: T[]; matrix: number[][] } {
    const nodes = this.nodes;
    const nodeIndex = new Map<T, number>();
    nodes.forEach((node, i) => nodeIndex.set(node, i));

    const matrix = Array.from({ length: nodes.length }, () =>
      Array(nodes.length).fill(Infinity)
    );

    // Set diagonal to 0
    for (let i = 0; i < nodes.length; i++) {
      matrix[i][i] = 0;
    }

    for (const [from, neighbors] of this.adjacencyList) {
      const fromIdx = nodeIndex.get(from)!;
      for (const [to, weight] of neighbors) {
        const toIdx = nodeIndex.get(to)!;
        matrix[fromIdx][toIdx] = weight;
      }
    }

    return { nodes, matrix };
  }

  /**
   * Create from adjacency matrix
   */
  static fromAdjacencyMatrix<T>(
    nodes: T[],
    matrix: number[][],
    directed = false
  ): Graph<T> {
    const graph = new Graph<T>(directed);

    for (const node of nodes) {
      graph.addNode(node);
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = directed ? 0 : i + 1; j < nodes.length; j++) {
        if (matrix[i][j] !== Infinity && matrix[i][j] !== 0) {
          graph.addEdge(nodes[i], nodes[j], matrix[i][j]);
        }
      }
    }

    return graph;
  }

  /**
   * Convert to JSON
   */
  toJSON(): { directed: boolean; nodes: T[]; edges: Edge<T>[] } {
    return {
      directed: this.isDirected,
      nodes: this.nodes,
      edges: this.edges,
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON<T>(json: {
    directed: boolean;
    nodes: T[];
    edges: Edge<T>[];
  }): Graph<T> {
    const graph = new Graph<T>(json.directed);

    for (const node of json.nodes) {
      graph.addNode(node);
    }

    for (const edge of json.edges) {
      graph.addEdge(edge.from, edge.to, edge.weight);
    }

    return graph;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a directed graph
 */
export function createDirectedGraph<T = string>(): Graph<T> {
  return new Graph<T>(true);
}

/**
 * Create an undirected graph
 */
export function createUndirectedGraph<T = string>(): Graph<T> {
  return new Graph<T>(false);
}

/**
 * Create a graph from edge list
 */
export function fromEdgeList<T = string>(
  edges: Edge<T>[],
  directed = false
): Graph<T> {
  const graph = new Graph<T>(directed);

  for (const edge of edges) {
    graph.addEdge(edge.from, edge.to, edge.weight);
  }

  return graph;
}

/**
 * Check if graph is tree (connected acyclic undirected graph)
 */
export function isTree<T>(graph: Graph<T>): boolean {
  if (graph.directed) return false;
  if (graph.size === 0) return true;
  if (graph.edges.length !== graph.size - 1) return false;

  const components = graph.getConnectedComponents();
  return components.length === 1 && !graph.hasCycle();
}

/**
 * Check if graph is forest (collection of trees)
 */
export function isForest<T>(graph: Graph<T>): boolean {
  if (graph.directed) return false;
  return !graph.hasCycle();
}

// ============================================================================
// Export Default
// ============================================================================

export const graphUtils = {
  Graph,
  createDirectedGraph,
  createUndirectedGraph,
  fromEdgeList,
  isTree,
  isForest,
};
