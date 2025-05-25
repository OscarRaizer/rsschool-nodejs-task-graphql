export interface CreateUserInputType {
  name: string;
  balance: number;
}

export interface ChangeUserInputType {
  name?: string;
  balance?: number;
}

export interface CreatePostInputType {
  title: string;
  content: string;
  authorId: string;
}

export interface ChangePostInputType {
  title?: string;
  content?: string;
}

export interface CreateProfileInputType {
  isMale: boolean;
  yearOfBirth: number;
  userId: string;
  memberTypeId: 'BASIC' | 'BUSINESS';
}

export interface ChangeProfileInputType {
  isMale?: boolean;
  yearOfBirth?: number;
  memberTypeId?: 'BASIC' | 'BUSINESS';
}
