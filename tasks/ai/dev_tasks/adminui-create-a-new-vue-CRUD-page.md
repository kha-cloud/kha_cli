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
						style="margin-right: 10px; margin-top: -30px; top: 10px; position: relative"
					>mdi-folder-star-multiple-outline</v-icon>
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
			<template v-slot:headBeforeSpacer>
				<!-- Here you can elements that will be displayed before the search bar and the add button with a spacer between them -->
			</template>

			<template v-slot:prependActions="{ item }">
				<!-- Here you can add action buttons that will be displayed before the default (edit, delete) actions -->
			</template>

			<!-- <template v-slot:browse.item.PARAM_VELUE="{ item }">
				Custom content for the browse view (Data table)
			</template> -->

			<!-- <template v-slot:dialog.item.PARAM_VELUE="{ inputsData }">
				Custom content for the add/edit dialog views (inputsData is like "item" and could be edited directly)
			</template> -->

			<!-- Example of a custom field for a relation with multiple items (Some relations could have only one item) -->
			<!-- <template v-slot:browse.item.subjectsIds="{ item }">
				<span style="font-size: 12px;">
					{{ item.subjectsIds.slice(0, 3).map((subjectId) => (subjects[subjectId].name)).join(", ") }}
					{{ item.subjectsIds.length > 3 ? ", ..." : "" }}
				</span>
			</template> -->

			<template v-slot:browse.item.icon="{ item }"> <!-- This is only for image attributes -->
				<img :src="item.icon ? item.icon.path : '/images/placeholder.png'" class="project-thumbnail" />
			</template>


			<template v-slot:dialog.item.customFieldUI="{ inputsData }">
				<div class="mt-2 mb-3">
					<!-- Example button (it could be inputs, forms, ... anything) -->
					<v-btn
						color="success"
						@click="inputsData['customFieldUI'] = 'test'"
					>
						<v-icon left>mdi-test-tube</v-icon>
						Test update
					</v-btn>
				</div>
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
				// This is an example of a custom field in the UI of the CRUD (See above HTML for the rest of the code)
				// the setted "v-slot:dialog.item.VALUE" (VALUE is customFieldUI in this example) should be used in the above HTML
				{
					text: "Custom Field UI",
					value: "customFieldUI",
					type: "custom", // should be "custom" to prevent the default UI from rendering
					hideBrowse: false,
				},

				// Advanced Example with select type and conditional visibility
        // {
        //   text: "Key",
        //   value: "key",
				// 	isVisible: (inputsData) => (inputsData.type == "static"),
        //   type: "select", // all, free-users, offer, grade, custom
				// 	typeData: {
				// 		items: [
				// 			{ text: "All", value: "all" },
				// 			{ text: "Free Users", value: "free-users" },
				// 			{ text: "Offer", value: "offer" },
				// 			{ text: "Grade", value: "grade" },
				// 			{ text: "Custom", value: "custom" },
				// 		],
				// 	},
				// },

				// Advanced Example with select type for connected models (relations)
				// NOTE: When making a relation like the following example, you should make custom browse item for it in the above HTML
				// {
				// 	text: "Subjects",
				// 	value: "subjectsIds",
				// 	type: "select",
				// 	typeData: {
				// 		items: this.subjects.map((item) => { // `this.subjects` should be loaded from the API, this is just an example
				// 			return {
				// 				text: item.name,
				// 				value: item.id,
				// 			};
				// 		}),
				// 		label: "Subjects",
				// 		multiple: true,
				// 		chips: true,
				// 	},
				// },
				
				// Advanced very complicated example with "khafield" type (May be used in advanced cases)
				// {
				// 	text: "Payments",
				// 	value: "payments",
				// 	type: "khafield",
				// 	schema: {
        //     type: "list",
        //     sortable: true,
        //     askToRemove: true,
        //     groupeForceExpansion: true,
        //     itemName: "Payment",
        //     addButtonCaption: "Add Payment",
        //     label: "Payments",
        //     addButtonProps: {
        //       large: true,
        //       style: "font-weight: 500;",
        //       outlined: false,
        //       class: "normal-btn mx-auto d-block",
        //       color: "#5d9aff",
        //       iconName: "mdi-plus",
        //       dark: true,
        //     },
        //     itemSchema: {
        //       type: "group",
        //       expansion: true,
        //       defaultExpansion: false,
        //       label: "{deadline} [{status}]",
        //       schema: {
        //         // deadline status price type receiptId
        //         deadline: {
        //           type: "text",
				// 		      "inputType": "datetime-local",
        //           outlined: true,
        //           label: "Deadline",
        //           placeholder: "Enter deadline",
        //         },
        //         status: {
        //           type: "select",
        //           outlined: true,
        //           label: "Status",
        //           placeholder: "Enter status",
        //           items: [
        //             { text: "Pending", value: "pending" },
        //             { text: "Verifiying", value: "verifiying" },
        //             { text: "Approved", value: "approved" },
        //             { text: "Rejected", value: "rejected" },
        //           ],
        //         },
        //         price: {
        //           type: "text",
        //           outlined: true,
        //           label: "Price",
        //           placeholder: "Enter price",
        //         },
        //         type: {
        //           type: "select",
        //           outlined: true,
        //           label: "Type",
        //           items: [
        //             { text: "By cash", value: "cash" },
        //             { text: "By check", value: "check" },
        //             { text: "By Bank Transfer", value: "bank-transfer" },
				// 						{ text: "By Postal Transfer", value: "postal-transfer" },
				// 						{ text: "By Online Payment", value: "online-payment" },
        //           ],
        //         },
        //         receipt: {
        //           type: "media",
        //           outlined: true,
        //           singleFile: true,
        //           tag: "picture", // picture, video, pdf, download [download is for all file types]
        //           label: "Receipt",
        //         },
        //       }
        //     }
        //   },
				// 	hideBrowse: true,
				// },

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