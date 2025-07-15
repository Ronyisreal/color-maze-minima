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

  // Calculate chromatic number using Welsh-Powell algorithm
  calculateChromaticNumber(): number {
    const nodes = Array.from(this.graph.nodes.values());
    
    if (nodes.length === 0) return 0;
    
    // Sort nodes by degree (number of adjacent nodes) in descending order
    const sortedNodes = nodes.sort((a, b) => b.adjacents.size - a.adjacents.size);
    
    // Color assignment map
    const coloring = new Map<string, number>();
    let maxColor = 0;

    for (const node of sortedNodes) {
      // Find the smallest color that can be assigned to this node
      const usedColors = new Set<number>();
      
      // Check colors of adjacent nodes
      for (const adjacentId of node.adjacents) {
        if (coloring.has(adjacentId)) {
          usedColors.add(coloring.get(adjacentId)!);
        }
      }

      // Find the smallest available color
      let color = 1;
      while (usedColors.has(color)) {
        color++;
      }

      coloring.set(node.id, color);
      maxColor = Math.max(maxColor, color);
    }

    return maxColor;
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
