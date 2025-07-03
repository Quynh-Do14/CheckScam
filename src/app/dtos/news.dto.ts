export class NewsDTO {
    name: string;
    shortDescription: string;
    content: string;
    isMain?: boolean; // Thêm field đánh dấu tin chính

    constructor(data: any) {
        this.name = data.name;
        this.shortDescription = data.shortDescription;
        this.content = data.content;
        this.isMain = data.isMain || false;
    }
}