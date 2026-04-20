export interface Breadcrumb {
  name: string;
  path: string;
}

export interface BreadcrumbState {
  breadcrumbs: Breadcrumb[];
}