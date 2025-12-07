/**
 * Graph Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  Graph,
  createDirectedGraph,
  createUndirectedGraph,
  fromEdgeList,
  isTree,
  isForest,
} from './graph';

describe('Graph Utilities', () => {
  describe('Graph - Basic Operations', () => {
    it('should create empty graph', () => {
      const graph = new Graph();
      expect(graph.size).toBe(0);
      expect(graph.nodes).toEqual([]);
    });

    it('should add nodes', () => {
      const graph = new Graph<string>();
      graph.addNode('A');
      graph.addNode('B');
      expect(graph.size).toBe(2);
      expect(graph.hasNode('A')).toBe(true);
      expect(graph.hasNode('C')).toBe(false);
    });

    it('should add edges', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B', 5);
      expect(graph.hasEdge('A', 'B')).toBe(true);
      expect(graph.getWeight('A', 'B')).toBe(5);
    });

    it('should be undirected by default', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B');
      expect(graph.hasEdge('A', 'B')).toBe(true);
      expect(graph.hasEdge('B', 'A')).toBe(true);
    });

    it('should support directed graphs', () => {
      const graph = new Graph<string>(true);
      graph.addEdge('A', 'B');
      expect(graph.hasEdge('A', 'B')).toBe(true);
      expect(graph.hasEdge('B', 'A')).toBe(false);
    });

    it('should remove nodes', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.removeNode('B');
      expect(graph.hasNode('B')).toBe(false);
      expect(graph.hasEdge('A', 'B')).toBe(false);
    });

    it('should remove edges', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B');
      graph.removeEdge('A', 'B');
      expect(graph.hasEdge('A', 'B')).toBe(false);
    });

    it('should get neighbors', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B');
      graph.addEdge('A', 'C');
      const neighbors = graph.getNeighbors('A');
      expect(neighbors).toContain('B');
      expect(neighbors).toContain('C');
    });

    it('should calculate degree', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B');
      graph.addEdge('A', 'C');
      graph.addEdge('A', 'D');
      expect(graph.getDegree('A')).toBe(3);
    });
  });

  describe('Graph - Traversal', () => {
    it('should perform BFS', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B');
      graph.addEdge('A', 'C');
      graph.addEdge('B', 'D');
      graph.addEdge('C', 'E');

      const visited = graph.bfs({ start: 'A' });
      expect(visited).toContain('A');
      expect(visited).toContain('B');
      expect(visited).toContain('C');
      expect(visited.indexOf('A')).toBeLessThan(visited.indexOf('D'));
    });

    it('should perform DFS', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B');
      graph.addEdge('A', 'C');
      graph.addEdge('B', 'D');

      const visited = graph.dfs({ start: 'A' });
      expect(visited).toContain('A');
      expect(visited).toContain('B');
      expect(visited).toContain('C');
      expect(visited).toContain('D');
    });

    it('should respect maxDepth', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'D');

      const visited = graph.bfs({ start: 'A', maxDepth: 1 });
      expect(visited).toContain('A');
      expect(visited).toContain('B');
      expect(visited).not.toContain('C');
    });

    it('should call visitor callback', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');

      const nodes: string[] = [];
      graph.bfs({
        start: 'A',
        visit: node => {
          nodes.push(node);
        },
      });

      expect(nodes).toEqual(['A', 'B', 'C']);
    });
  });

  describe('Graph - Path Finding', () => {
    it('should find shortest path with Dijkstra', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B', 1);
      graph.addEdge('B', 'C', 2);
      graph.addEdge('A', 'C', 5);

      const result = graph.dijkstra('A', 'C');
      expect(result.found).toBe(true);
      expect(result.distance).toBe(3);
      expect(result.path).toEqual(['A', 'B', 'C']);
    });

    it('should return not found for unreachable nodes', () => {
      const graph = new Graph<string>(true);
      graph.addNode('A');
      graph.addNode('B');

      const result = graph.dijkstra('A', 'B');
      expect(result.found).toBe(false);
      expect(result.distance).toBe(Infinity);
    });

    it('should find all paths', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B');
      graph.addEdge('A', 'C');
      graph.addEdge('B', 'D');
      graph.addEdge('C', 'D');

      const paths = graph.findAllPaths('A', 'D');
      expect(paths.length).toBe(2);
    });

    it('should use Bellman-Ford for negative weights', () => {
      const graph = new Graph<string>(true);
      graph.addEdge('A', 'B', 1);
      graph.addEdge('B', 'C', -2);
      graph.addEdge('A', 'C', 5);

      const result = graph.bellmanFord('A');
      expect(result).not.toBeNull();
      expect(result!.get('C')?.distance).toBe(-1);
    });
  });

  describe('Graph - Analysis', () => {
    it('should detect cycles', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      expect(graph.hasCycle()).toBe(false);

      graph.addEdge('C', 'A');
      expect(graph.hasCycle()).toBe(true);
    });

    it('should perform topological sort', () => {
      const graph = new Graph<string>(true);
      graph.addEdge('A', 'B');
      graph.addEdge('A', 'C');
      graph.addEdge('B', 'D');
      graph.addEdge('C', 'D');

      const sorted = graph.topologicalSort();
      expect(sorted).not.toBeNull();
      expect(sorted!.indexOf('A')).toBeLessThan(sorted!.indexOf('B'));
      expect(sorted!.indexOf('A')).toBeLessThan(sorted!.indexOf('C'));
      expect(sorted!.indexOf('B')).toBeLessThan(sorted!.indexOf('D'));
    });

    it('should return null for cyclic graph topological sort', () => {
      const graph = new Graph<string>(true);
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'A');

      expect(graph.topologicalSort()).toBeNull();
    });

    it('should find connected components', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B');
      graph.addEdge('C', 'D');
      graph.addNode('E');

      const components = graph.getConnectedComponents();
      expect(components.length).toBe(3);
    });

    it('should check bipartite', () => {
      const bipartite = new Graph<string>();
      bipartite.addEdge('A', 'B');
      bipartite.addEdge('B', 'C');
      bipartite.addEdge('C', 'D');
      expect(bipartite.isBipartite()).toBe(true);

      const nonBipartite = new Graph<string>();
      nonBipartite.addEdge('A', 'B');
      nonBipartite.addEdge('B', 'C');
      nonBipartite.addEdge('C', 'A');
      expect(nonBipartite.isBipartite()).toBe(false);
    });

    it('should find articulation points', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('B', 'D');

      const ap = graph.getArticulationPoints();
      expect(ap).toContain('B');
    });

    it('should find bridges', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');

      const bridges = graph.getBridges();
      expect(bridges.length).toBe(2);
    });
  });

  describe('Graph - Minimum Spanning Tree', () => {
    it('should find MST with Kruskal', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B', 1);
      graph.addEdge('B', 'C', 2);
      graph.addEdge('A', 'C', 3);

      const mst = graph.kruskalMST();
      expect(mst).not.toBeNull();
      expect(mst!.weight).toBe(3);
      expect(mst!.edges.length).toBe(2);
    });

    it('should find MST with Prim', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B', 1);
      graph.addEdge('B', 'C', 2);
      graph.addEdge('A', 'C', 3);

      const mst = graph.primMST();
      expect(mst).not.toBeNull();
      expect(mst!.weight).toBe(3);
    });

    it('should return null for disconnected graph', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B');
      graph.addNode('C');

      expect(graph.kruskalMST()).toBeNull();
    });
  });

  describe('Graph - Serialization', () => {
    it('should convert to adjacency matrix', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B', 5);

      const { nodes, matrix } = graph.toAdjacencyMatrix();
      expect(nodes).toContain('A');
      expect(nodes).toContain('B');

      const aIdx = nodes.indexOf('A');
      const bIdx = nodes.indexOf('B');
      expect(matrix[aIdx][bIdx]).toBe(5);
    });

    it('should create from adjacency matrix', () => {
      const nodes = ['A', 'B', 'C'];
      const matrix = [
        [0, 1, Infinity],
        [1, 0, 2],
        [Infinity, 2, 0],
      ];

      const graph = Graph.fromAdjacencyMatrix(nodes, matrix);
      expect(graph.hasEdge('A', 'B')).toBe(true);
      expect(graph.hasEdge('A', 'C')).toBe(false);
    });

    it('should convert to/from JSON', () => {
      const graph = new Graph<string>(true);
      graph.addEdge('A', 'B', 5);
      graph.addEdge('B', 'C', 3);

      const json = graph.toJSON();
      const restored = Graph.fromJSON(json);

      expect(restored.directed).toBe(true);
      expect(restored.hasEdge('A', 'B')).toBe(true);
      expect(restored.getWeight('A', 'B')).toBe(5);
    });
  });

  describe('Helper Functions', () => {
    it('should create directed graph', () => {
      const graph = createDirectedGraph<string>();
      expect(graph.directed).toBe(true);
    });

    it('should create undirected graph', () => {
      const graph = createUndirectedGraph<string>();
      expect(graph.directed).toBe(false);
    });

    it('should create from edge list', () => {
      const edges = [
        { from: 'A', to: 'B', weight: 1 },
        { from: 'B', to: 'C', weight: 2 },
      ];

      const graph = fromEdgeList(edges);
      expect(graph.hasEdge('A', 'B')).toBe(true);
      expect(graph.hasEdge('B', 'C')).toBe(true);
    });

    it('should check if graph is tree', () => {
      const tree = new Graph<string>();
      tree.addEdge('A', 'B');
      tree.addEdge('B', 'C');
      tree.addEdge('B', 'D');
      expect(isTree(tree)).toBe(true);

      const notTree = new Graph<string>();
      notTree.addEdge('A', 'B');
      notTree.addEdge('B', 'C');
      notTree.addEdge('C', 'A');
      expect(isTree(notTree)).toBe(false);
    });

    it('should check if graph is forest', () => {
      const forest = new Graph<string>();
      forest.addEdge('A', 'B');
      forest.addEdge('C', 'D');
      expect(isForest(forest)).toBe(true);
    });
  });

  describe('Graph Statistics', () => {
    it('should calculate stats', () => {
      const graph = new Graph<string>();
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('A', 'C');

      const stats = graph.getStats();
      expect(stats.nodes).toBe(3);
      expect(stats.edges).toBe(3);
      expect(stats.directed).toBe(false);
      expect(stats.density).toBeCloseTo(1);
    });
  });
});
