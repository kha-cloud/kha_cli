### TITLE
AdminUI - Create a new vue CRUD page
### DESCRIPTION
Create a new vue CRUD page which is a VueJS component that will use CRUD component to create a Model Management page
### REQUIREMENTS
name: string, // (REQUIRED) The name for the page (KebabCase)
content: string, // (REQUIRED) A detailed description of the content of the page
model: string, // (REQUIRED) The name of the model to be managed
plural_singular: string, // (REQUIRED) The plural and singular name of the model to be managed (KebabCase)
### OUTPUT_FORMAT
VueJS Component
### OUTPUT_LOCATION
@/adminUI/pages/{{requirements.name}}.vue
### AI_MODEL
gpt-3.5-turbo-16k|10240
### EXAMPLE
<template>
	<div class="project-crud-page-class">
		<CLoader cpn="Breadcrumb" title="Projects" :items="breadcrumb" class="mb-7 mt-3">
			<template v-slot:homeIcon>
				<img src="/images/store.png" style="width: 17px;margin-bottom: -1px;" />
			</template>
      <template v-slot:titleIcon>
          <!-- Material Design Icon (MDI) That have a similar meaning to the page -->
					<v-icon
					color="#8f8f8f" 
					size="50"
					style="margin-right: 10px; margin-top: -30px; top: 10px; position: relative">mdi-folder-star-multiple-outline</v-icon>
			</template>
		</CLoader>
		<CLoader
      cpn="Crud"
			ref="crud"
			shaped
			dialogType="dialog"
      addSheetWidth="500"
      editSheetWidth="500"
			noTitle
			:loading="loading"
			singleName="project"
			pluralName="projects"
			:structure="structure"
			:items="projects"
			browseCustomView
			@browseViewClick="viewProject"
			browseRowClickable
			emptyOnNewItem
			:additionalHeaderSize="300"
			@insertRequest="insertRequest"
			@updateRequest="updateRequest"
			@deleteRequest="deleteRequest"
			searchable
		>
      <!-- Your custom CRUD content here -->

			<template v-slot:browse.item.icon="{ item }"> <!-- This is only for image attributes -->
				<img :src="item.icon ? item.icon.path : '/images/placeholder.png'" class="project-thumbnail" />
			</template>
		</CLoader>
		
	</div>
</template>

<script>

export default {
	data(){
		return {
			loading: false,
			projects: [],
		};
	},
	computed: {
		breadcrumb(){
			return [
				{
					text: "Projects",
					to: "/projects",
					disabled: false,
				},
			];
		},
		structure(){
			return [
				{ // Required
					text: "Id",
					value: "id",
					type: "hidden",
				},

        // Model attributes here
        {
					text: "Title",
					value: "title",
					type: "text"
				},
				{
					text: "Description",
					value: "description",
					type: "textarea",
					hideBrowse: true,
				},
				{
					text: "Icon",
					value: "icon",
					type: "image",
					hideBrowse: false,
				},

				{ // Required
					text: this.$t('common.actions'),
					value: "actions",
					type: "actions",
				},
			];
		},
	},
	mounted(){
		this.loadProjects();
	},
	methods: { // Keep the methods as they are just replace "Project" with the name of the model, or add more methods if needed
		loadProjects(){
			this.loading = true;
			this.$dataCaller("get", "/api/pr/projects").then((data) => { // `/api/pr/` is the prefix for all the API routes
				this.projects = data;
				this.loading = false;
			});
		},
		viewProject(item){
			this.$refs.crud.cp.browse.openUpdatePanel(item);
		},
		insertRequest(data){
			this.$dataCaller("post", "/api/pr/projects", data).then((_) => {
				this.loading = false;
				this.loadProjects();
			});
		},
		updateRequest(data){
			this.$dataCaller("put", "/api/pr/projects/"+data.id, data).then((_) => {
				this.loading = false;
				this.loadProjects();
			});
		},
		deleteRequest(data){
			this.$dataCaller("delete", "/api/pr/projects/"+data.id).then((_) => {
				this.loading = false;
				this.loadProjects();
			});
		},
	},
}
</script>

<style>
  /* Your CSS here */
.project-crud-page-class .project-thumbnail{
	width: 100px;
	height: 70px;
	border: 1px solid #c1c1c1;
	border-radius: 4px;
	object-fit: cover;
	background-color: white;
	padding: 1px;
	margin-top: 5px;
}
</style>
### END_OF_TASK