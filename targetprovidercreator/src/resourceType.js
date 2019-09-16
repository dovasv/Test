export class ResourceType{
	constructor(id, name, description, type, schema="", profiles){
		this.schemas =  ["urn:ietf:params:scim:schemas:core:2.0:ResourceType"]
		this.id = id
		this.name = name
		this.endpoint = type == 'SupportingData'?'SupportingData':`${type}s`
		this.description = description
		this.schema = schema
		this.schemaExtensions = []

		if (profiles != undefined){
			new Array().concat(profiles).forEach(profile=>{
				console.log("profile:"+ profile )
				this.schemaExtensions.push({
					schema: `urn:ibm:idbrokerage:params:scim:schemas:extension:${profile}:2.0:${type}`,
					required: false
				})
			}, this)			
		}

		this.meta =  {
			location: `/v2/ResourceTypes/${type}`,
			resourceType: "ResourceType"
		}
	}
}