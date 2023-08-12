export default class Id {
  id = 0;
  get uid() {
    const id = this.id;
    this.id++;
    return id;
  }
}
