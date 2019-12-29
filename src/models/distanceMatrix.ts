export class DistanceMatrix {
  vertex: number;
  matrix: number[][];

  constructor(vertex: number) {
    this.vertex = vertex;
    this.matrix = new Array(this.vertex);

    for (let i = 0; i < this.matrix.length; i++) {
      this.matrix[i] = new Array(this.vertex);
    }
  }

  public addEdge(source: number, destination: number, weight: number): void {
    //add edge
    this.matrix[source][destination] = weight;

    //add bak edge for undirected graph
    this.matrix[destination][source] = weight;
  }

  public printGraph() {
    for (let i = 0; i < this.vertex; i++) {
      const row = [];
      for (let j = 0; j < this.vertex; j++) {
        row.push(this.matrix[i][j]);
      }

      console.log(i + ": " + row.join("  "));
    }

    //console.log(JSON.stringify(this.matrix));
  }
}
