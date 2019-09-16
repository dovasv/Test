export class Otherschema{
	constructor(resourceType){
		this.id = resourceType.id
		this.name = resourceType.name
		this.description = `${this.id} schema`
		this.attributes = []
	}
}