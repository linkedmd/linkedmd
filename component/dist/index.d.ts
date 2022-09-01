/// <reference types="react" />
import './styles.css';
declare type FileURICallback = (newFileURI: string) => any;
interface Props {
    fileURI: string;
    onFileURIChange?: FileURICallback;
}
export declare const LinkedMarkdownViewer: ({ fileURI, onFileURIChange }: Props) => JSX.Element;
export declare const LinkedMarkdownEditor: ({ fileURI }: Props) => JSX.Element;
export {};
