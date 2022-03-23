import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class httpService {
  baseUrl: string = environment.serverUrl;
  constructor(private httpClient: HttpClient) {}

  public setHttpHeader(key: string[], value: string[]): HttpHeaders {
    let headers = new HttpHeaders();
    if (key.length != value.length) return headers;
    if (key || value) {
      for (let i = 0; i < key.length; i++) {
        headers = headers.set(key[i], value[i]);
      }
    }
    return headers;
  }

  public getRequest<T>(
    url: string,
    headers: HttpHeaders,
    httpData: any
  ): Observable<HttpResponse<T>> {
    return this.httpClient.get<T>(this.baseUrl + url, {
      headers: headers,
      observe: 'response',
      params: httpData,
    });
  }

  public postRequest<T>(
    url: string,
    headers: HttpHeaders,
    httpData: any
  ): Observable<HttpResponse<T>> {
    return this.httpClient.post<T>(this.baseUrl + url, httpData, {
      headers: headers,
      observe: 'response',
    });
  }

  public putRequest<T>(
    url: string,
    headers: HttpHeaders,
    httpData: any
  ): Observable<HttpResponse<T>> {
    return this.httpClient.put<T>(this.baseUrl + url, httpData, {
      headers: headers,
      observe: 'response',
    });
  }

  public deleteRequest<T>(
    url: string,
    headers: HttpHeaders,
    httpData: any
  ): Observable<HttpResponse<T>> {
    return this.httpClient.delete<T>(this.baseUrl + url, {
      headers: headers,
      body: httpData,
      observe: 'response',
    });
  }
}
