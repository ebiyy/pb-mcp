export interface ToolDef {
	name: string;
	description: string;
	method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
	path: string;
	wrap?: 'data' | 'none';
	inputSchema: {
		type: 'object';
		properties: Record<string, unknown>;
		required?: string[];
	};
}

const id = { type: 'string', description: 'Resource ID' };
const pagination = {
	limit: { type: 'number', description: 'Max items to return (1-100)' },
	offset: { type: 'number', description: 'Pagination offset' },
};

export const toolDefs: ToolDef[] = [
	// ── Features ──────────────────────────────────────────
	{
		name: 'get_features',
		description: 'List all features with optional filters',
		method: 'GET',
		path: '/features',
		inputSchema: {
			type: 'object',
			properties: {
				...pagination,
				archived: { type: 'boolean', description: 'Filter by archived status' },
				ownerEmail: { type: 'string', description: 'Filter by owner email' },
				parentId: { type: 'string', description: 'Filter by parent feature ID' },
			},
		},
	},
	{
		name: 'get_feature',
		description: 'Get a specific feature by ID',
		method: 'GET',
		path: '/features/{id}',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},
	{
		name: 'create_feature',
		description: 'Create a new feature',
		method: 'POST',
		path: '/features',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string', description: 'Feature name' },
				description: { type: 'string', description: 'Feature description' },
				status: { type: 'object', description: 'Status object with id and name' },
				owner: { type: 'object', description: 'Owner object' },
				parent: { type: 'object', description: 'Parent feature reference' },
			},
			required: ['name'],
		},
	},
	{
		name: 'update_feature',
		description: 'Update an existing feature',
		method: 'PATCH',
		path: '/features/{id}',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				id,
				name: { type: 'string', description: 'Feature name' },
				description: { type: 'string', description: 'Feature description' },
				status: { type: 'object', description: 'Status object' },
				archived: { type: 'boolean', description: 'Archived status' },
			},
			required: ['id'],
		},
	},
	{
		name: 'delete_feature',
		description: 'Delete a feature',
		method: 'DELETE',
		path: '/features/{id}',
		wrap: 'none',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},

	// ── Notes ─────────────────────────────────────────────
	{
		name: 'get_notes',
		description: 'List notes with optional filters',
		method: 'GET',
		path: '/notes',
		inputSchema: {
			type: 'object',
			properties: {
				...pagination,
				term: { type: 'string', description: 'Search term' },
				companyId: { type: 'string', description: 'Filter by company' },
				featureId: { type: 'string', description: 'Filter by feature' },
				ownerEmail: { type: 'string', description: 'Filter by owner email' },
			},
		},
	},
	{
		name: 'get_note',
		description: 'Get a specific note by ID',
		method: 'GET',
		path: '/notes/{id}',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},
	{
		name: 'create_note',
		description: 'Create a new note',
		method: 'POST',
		path: '/notes',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				title: { type: 'string', description: 'Note title' },
				content: { type: 'string', description: 'Note content (HTML)' },
				displayUrl: { type: 'string', description: 'Source display URL' },
				userEmail: { type: 'string', description: 'User email' },
				companyDomain: { type: 'string', description: 'Company domain' },
				tags: { type: 'array', description: 'Tags to apply' },
			},
			required: ['title', 'content'],
		},
	},
	{
		name: 'update_note',
		description: 'Update an existing note',
		method: 'PATCH',
		path: '/notes/{id}',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				id,
				title: { type: 'string', description: 'Note title' },
				content: { type: 'string', description: 'Note content (HTML)' },
				tags: { type: 'array', description: 'Tags to apply' },
			},
			required: ['id'],
		},
	},
	{
		name: 'delete_note',
		description: 'Delete a note',
		method: 'DELETE',
		path: '/notes/{id}',
		wrap: 'none',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},
	{
		name: 'list_note_tags',
		description: 'List tags on a note',
		method: 'GET',
		path: '/notes/{noteId}/tags',
		inputSchema: {
			type: 'object',
			properties: {
				noteId: { type: 'string', description: 'Note ID' },
			},
			required: ['noteId'],
		},
	},
	{
		name: 'add_note_tag',
		description: 'Add a tag to a note',
		method: 'POST',
		path: '/notes/{noteId}/tags/{tagName}',
		wrap: 'none',
		inputSchema: {
			type: 'object',
			properties: {
				noteId: { type: 'string', description: 'Note ID' },
				tagName: { type: 'string', description: 'Tag name' },
			},
			required: ['noteId', 'tagName'],
		},
	},
	{
		name: 'remove_note_tag',
		description: 'Remove a tag from a note',
		method: 'DELETE',
		path: '/notes/{noteId}/tags/{tagName}',
		wrap: 'none',
		inputSchema: {
			type: 'object',
			properties: {
				noteId: { type: 'string', description: 'Note ID' },
				tagName: { type: 'string', description: 'Tag name' },
			},
			required: ['noteId', 'tagName'],
		},
	},

	// ── Companies ─────────────────────────────────────────
	{
		name: 'get_companies',
		description: 'List all companies with optional filters',
		method: 'GET',
		path: '/companies',
		inputSchema: {
			type: 'object',
			properties: {
				...pagination,
				term: { type: 'string', description: 'Search term' },
			},
		},
	},
	{
		name: 'get_company',
		description: 'Get a specific company by ID',
		method: 'GET',
		path: '/companies/{id}',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},
	{
		name: 'create_company',
		description: 'Create a new company',
		method: 'POST',
		path: '/companies',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string', description: 'Company name' },
				domain: { type: 'string', description: 'Company domain' },
				description: { type: 'string', description: 'Company description' },
				externalId: { type: 'string', description: 'External identifier' },
			},
			required: ['name'],
		},
	},
	{
		name: 'update_company',
		description: 'Update a company',
		method: 'PATCH',
		path: '/companies/{id}',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				id,
				name: { type: 'string', description: 'Company name' },
				domain: { type: 'string', description: 'Company domain' },
				description: { type: 'string', description: 'Company description' },
			},
			required: ['id'],
		},
	},
	{
		name: 'delete_company',
		description: 'Delete a company',
		method: 'DELETE',
		path: '/companies/{id}',
		wrap: 'none',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},

	// ── Objectives ────────────────────────────────────────
	{
		name: 'get_objectives',
		description: 'List all objectives',
		method: 'GET',
		path: '/objectives',
		inputSchema: {
			type: 'object',
			properties: { ...pagination },
		},
	},
	{
		name: 'get_objective',
		description: 'Get a specific objective by ID',
		method: 'GET',
		path: '/objectives/{id}',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},
	{
		name: 'create_objective',
		description: 'Create a new objective',
		method: 'POST',
		path: '/objectives',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string', description: 'Objective name' },
				description: { type: 'string', description: 'Objective description' },
				ownerId: { type: 'string', description: 'Owner user ID' },
				startDate: { type: 'string', description: 'Start date (ISO 8601)' },
				endDate: { type: 'string', description: 'End date (ISO 8601)' },
			},
			required: ['name'],
		},
	},
	{
		name: 'update_objective',
		description: 'Update an objective',
		method: 'PATCH',
		path: '/objectives/{id}',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				id,
				name: { type: 'string', description: 'Objective name' },
				description: { type: 'string', description: 'Objective description' },
				ownerId: { type: 'string', description: 'Owner user ID' },
			},
			required: ['id'],
		},
	},
	{
		name: 'delete_objective',
		description: 'Delete an objective',
		method: 'DELETE',
		path: '/objectives/{id}',
		wrap: 'none',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},

	// ── Initiatives ───────────────────────────────────────
	{
		name: 'get_initiatives',
		description: 'List all initiatives',
		method: 'GET',
		path: '/initiatives',
		inputSchema: {
			type: 'object',
			properties: { ...pagination },
		},
	},
	{
		name: 'get_initiative',
		description: 'Get a specific initiative by ID',
		method: 'GET',
		path: '/initiatives/{id}',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},
	{
		name: 'create_initiative',
		description: 'Create a new initiative',
		method: 'POST',
		path: '/initiatives',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string', description: 'Initiative name' },
				description: { type: 'string', description: 'Initiative description' },
				ownerId: { type: 'string', description: 'Owner user ID' },
				status: { type: 'string', description: 'Initiative status' },
			},
			required: ['name'],
		},
	},
	{
		name: 'update_initiative',
		description: 'Update an initiative',
		method: 'PATCH',
		path: '/initiatives/{id}',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				id,
				name: { type: 'string', description: 'Initiative name' },
				description: { type: 'string', description: 'Initiative description' },
			},
			required: ['id'],
		},
	},
	{
		name: 'delete_initiative',
		description: 'Delete an initiative',
		method: 'DELETE',
		path: '/initiatives/{id}',
		wrap: 'none',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},

	// ── Key Results ───────────────────────────────────────
	{
		name: 'get_key_results',
		description: 'List all key results',
		method: 'GET',
		path: '/key-results',
		inputSchema: {
			type: 'object',
			properties: { ...pagination },
		},
	},
	{
		name: 'get_key_result',
		description: 'Get a specific key result by ID',
		method: 'GET',
		path: '/key-results/{id}',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},
	{
		name: 'create_key_result',
		description: 'Create a new key result',
		method: 'POST',
		path: '/key-results',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string', description: 'Key result name' },
				objectiveId: { type: 'string', description: 'Parent objective ID' },
				type: { type: 'string', description: 'Key result type' },
				targetValue: { type: 'number', description: 'Target value' },
			},
			required: ['name', 'objectiveId'],
		},
	},
	{
		name: 'update_key_result',
		description: 'Update a key result',
		method: 'PATCH',
		path: '/key-results/{id}',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				id,
				name: { type: 'string', description: 'Key result name' },
				currentValue: { type: 'number', description: 'Current value' },
				targetValue: { type: 'number', description: 'Target value' },
			},
			required: ['id'],
		},
	},
	{
		name: 'delete_key_result',
		description: 'Delete a key result',
		method: 'DELETE',
		path: '/key-results/{id}',
		wrap: 'none',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},

	// ── Releases ──────────────────────────────────────────
	{
		name: 'list_releases',
		description: 'List all releases',
		method: 'GET',
		path: '/releases',
		inputSchema: {
			type: 'object',
			properties: {
				...pagination,
				releaseGroupId: { type: 'string', description: 'Filter by release group' },
			},
		},
	},
	{
		name: 'get_release',
		description: 'Get a specific release by ID',
		method: 'GET',
		path: '/releases/{id}',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},
	{
		name: 'create_release',
		description: 'Create a new release',
		method: 'POST',
		path: '/releases',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string', description: 'Release name' },
				releaseGroupId: { type: 'string', description: 'Release group ID' },
				state: { type: 'string', description: 'Release state' },
				description: { type: 'string', description: 'Release description' },
				releaseDate: { type: 'string', description: 'Release date (ISO 8601)' },
			},
			required: ['name', 'releaseGroupId'],
		},
	},
	{
		name: 'update_release',
		description: 'Update a release',
		method: 'PATCH',
		path: '/releases/{id}',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				id,
				name: { type: 'string', description: 'Release name' },
				state: { type: 'string', description: 'Release state' },
				description: { type: 'string', description: 'Release description' },
				releaseDate: { type: 'string', description: 'Release date (ISO 8601)' },
			},
			required: ['id'],
		},
	},
	{
		name: 'delete_release',
		description: 'Delete a release',
		method: 'DELETE',
		path: '/releases/{id}',
		wrap: 'none',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},

	// ── Webhooks ──────────────────────────────────────────
	{
		name: 'list_webhooks',
		description: 'List all webhooks',
		method: 'GET',
		path: '/webhooks',
		inputSchema: {
			type: 'object',
			properties: { ...pagination },
		},
	},
	{
		name: 'get_webhook',
		description: 'Get a specific webhook by ID',
		method: 'GET',
		path: '/webhooks/{id}',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},
	{
		name: 'create_webhook',
		description: 'Create a webhook subscription',
		method: 'POST',
		path: '/webhooks',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string', description: 'Webhook name' },
				url: { type: 'string', description: 'Webhook callback URL' },
				events: { type: 'array', description: 'Events to subscribe to' },
				version: { type: 'string', description: 'Webhook version' },
			},
			required: ['name', 'url', 'events'],
		},
	},
	{
		name: 'delete_webhook',
		description: 'Delete a webhook',
		method: 'DELETE',
		path: '/webhooks/{id}',
		wrap: 'none',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},

	// ── Users ─────────────────────────────────────────────
	{
		name: 'get_users',
		description: 'List all users',
		method: 'GET',
		path: '/users',
		inputSchema: {
			type: 'object',
			properties: { ...pagination },
		},
	},
	{
		name: 'get_user',
		description: 'Get a specific user by ID',
		method: 'GET',
		path: '/users/{id}',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},
	{
		name: 'create_user',
		description: 'Create a new user',
		method: 'POST',
		path: '/users',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				email: { type: 'string', description: 'User email' },
				name: { type: 'string', description: 'User name' },
				role: { type: 'string', description: 'User role' },
			},
			required: ['email'],
		},
	},
	{
		name: 'update_user',
		description: 'Update a user',
		method: 'PATCH',
		path: '/users/{id}',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				id,
				name: { type: 'string', description: 'User name' },
				role: { type: 'string', description: 'User role' },
			},
			required: ['id'],
		},
	},
	{
		name: 'delete_user',
		description: 'Delete a user',
		method: 'DELETE',
		path: '/users/{id}',
		wrap: 'none',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},

	// ── Products ──────────────────────────────────────────
	{
		name: 'get_products',
		description: 'List all products',
		method: 'GET',
		path: '/products',
		inputSchema: {
			type: 'object',
			properties: { ...pagination },
		},
	},
	{
		name: 'get_product',
		description: 'Get a specific product by ID',
		method: 'GET',
		path: '/products/{id}',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},
	{
		name: 'update_product',
		description: 'Update a product',
		method: 'PATCH',
		path: '/products/{id}',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				id,
				name: { type: 'string', description: 'Product name' },
				description: { type: 'string', description: 'Product description' },
			},
			required: ['id'],
		},
	},

	// ── Components ────────────────────────────────────────
	{
		name: 'get_components',
		description: 'List all components',
		method: 'GET',
		path: '/components',
		inputSchema: {
			type: 'object',
			properties: {
				...pagination,
				productId: { type: 'string', description: 'Filter by product ID' },
			},
		},
	},
	{
		name: 'get_component',
		description: 'Get a specific component by ID',
		method: 'GET',
		path: '/components/{id}',
		inputSchema: {
			type: 'object',
			properties: { id },
			required: ['id'],
		},
	},
	{
		name: 'create_component',
		description: 'Create a new component',
		method: 'POST',
		path: '/components',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string', description: 'Component name' },
				description: { type: 'string', description: 'Component description' },
				ownerEmail: { type: 'string', description: 'Owner email' },
			},
			required: ['name'],
		},
	},
	{
		name: 'update_component',
		description: 'Update a component',
		method: 'PATCH',
		path: '/components/{id}',
		wrap: 'data',
		inputSchema: {
			type: 'object',
			properties: {
				id,
				name: { type: 'string', description: 'Component name' },
				description: { type: 'string', description: 'Component description' },
			},
			required: ['id'],
		},
	},
];
