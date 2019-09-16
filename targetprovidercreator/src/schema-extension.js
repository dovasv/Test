export class SchemaExtension{
	constructor(type, extensionName, objectProfile, groupname, profile){
		this.schema = `urn:ibm:idbrokerage:params:scim:schemas:extension:${profile}:2.0:${type}`
		this.definition = {}
		this.definition.id = this.schema
		this.definition.name = extensionName
		this.definition.description = `${objectProfile} ${type} schema`
		this.definition.attributes = []
		this.attributeMapping = JSON.parse(`{\"objectProfile\":\"${objectProfile}\",\"commonAttributes\":{\"meta\":{\"created\":\"\",\"lastModified\":\"\"}},\"coreAttributes\":{\"displayName\":\"${groupname}\",\"members\":[{\"value\":\"!!! Fill in the attrbute name of this group in the account class in schema.dsml\",\"type\":\"\"}]}}`)
	}
}