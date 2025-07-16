// Graph theory utilities for chromatic number calculation
export interface GraphNode {
  id: string;
  adjacents: Set<string>;
}

export interface Graph {
  nodes: Map<string, GraphNode>;
}

export class GraphColoringCalculator {
  private graph: Graph;

  constructor() {
    this.graph = { nodes: new Map() };
  }

  // Add a node to the graph
  addNode(id: string): void {
    if (!this.graph.nodes.has(id)) {
      this.graph.nodes.set(id, { id, adjacents: new Set() });
    }
  }

  // Add an edge between two nodes (undirected)
  addEdge(node1: string, node2: string): void {
    this.addNode(node1);
    this.addNode(node2);
    
    this.graph.nodes.get(node1)!.adjacents.add(node2);
    this.graph.nodes.get(node2)!.adjacents.add(node1);
  }

  // Calculate chromatic number using backtracking algorithm
  calculateChromaticNumber(): number {
    const nodes = Array.from(this.graph.nodes.values());
    
    if (nodes.length === 0) return 0;
    if (nodes.length === 1) return 1;
    
    // Try coloring with k colors, starting from 1
    for (let k = 1; k <= nodes.length; k++) {
      if (this.canColorWithKColors(nodes, k)) {
        return k;
      }
    }
    
    // Fallback (should never reach here for valid graphs)
    return nodes.length;
  }

  // Check if graph can be colored with k colors using backtracking
  private canColorWithKColors(nodes: GraphNode[], k: number): boolean {
    const coloring = new Map<string, number>();
    return this.backtrackColor(nodes, 0, k, coloring);
  }

  // Backtracking function to try all possible colorings
  private backtrackColor(nodes: GraphNode[], nodeIndex: number, k: number, coloring: Map<string, number>): boolean {
    // Base case: all nodes are colored
    if (nodeIndex === nodes.length) {
      return true;
    }

    const currentNode = nodes[nodeIndex];
    
    // Try each color from 1 to k
    for (let color = 1; color <= k; color++) {
      if (this.isSafeToColor(currentNode, color, coloring)) {
        // Assign color to current node
        coloring.set(currentNode.id, color);
        
        // Recursively try to color remaining nodes
        if (this.backtrackColor(nodes, nodeIndex + 1, k, coloring)) {
          return true;
        }
        
        // Backtrack: remove color assignment
        coloring.delete(currentNode.id);
      }
    }
    
    // No valid coloring found
    return false;
  }

  // Check if it's safe to assign a color to a node
  private isSafeToColor(node: GraphNode, color: number, coloring: Map<string, number>): boolean {
    // Check if any adjacent node has the same color
    for (const adjacentId of node.adjacents) {
      if (coloring.has(adjacentId) && coloring.get(adjacentId) === color) {
        return false;
      }
    }
    return true;
  }

  // Get the current graph structure
  getGraph(): Graph {
    return this.graph;
  }

  // Reset the graph
  reset(): void {
    this.graph = { nodes: new Map() };
  }

  // Check if two nodes are adjacent
  areAdjacent(node1: string, node2: string): boolean {
    const n1 = this.graph.nodes.get(node1);
    return n1 ? n1.adjacents.has(node2) : false;
  }

  // Get all nodes
  getNodes(): GraphNode[] {
    return Array.from(this.graph.nodes.values());
  }

  // Get node by id
  getNode(id: string): GraphNode | undefined {
    return this.graph.nodes.get(id);
  }

  // Generate a planar graph with specified connectivity
  generatePlanarGraph(numNodes: number, targetConnectivity: number = 2): void {
    this.reset();
    
    // Add all nodes first
    for (let i = 1; i <= numNodes; i++) {
      this.addNode(`region-${i}`);
    }

    // Create a connected graph with reasonable connectivity
    // Start with a spanning tree to ensure connectivity
    for (let i = 2; i <= numNodes; i++) {
      const parentIndex = Math.floor(Math.random() * (i - 1)) + 1;
      this.addEdge(`region-${i}`, `region-${parentIndex}`);
    }

    // Add additional edges to increase connectivity but keep it planar
    const maxAdditionalEdges = Math.min(
      targetConnectivity * numNodes / 2,
      3 * numNodes - 6 - (numNodes - 1) // Planar graph max edges minus spanning tree edges
    );

    for (let i = 0; i < maxAdditionalEdges; i++) {
      const node1 = Math.floor(Math.random() * numNodes) + 1;
      const node2 = Math.floor(Math.random() * numNodes) + 1;
      
      if (node1 !== node2 && !this.areAdjacent(`region-${node1}`, `region-${node2}`)) {
        this.addEdge(`region-${node1}`, `region-${node2}`);
      }
    }
  }
}
