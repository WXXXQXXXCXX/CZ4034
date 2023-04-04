import time
from pprint import pprint

from bs4 import BeautifulSoup
import csv
import requests
import re
import json
from langdetect import detect



def parse_url(url):

    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'lxml')
    # print(soup)
    with open('links.txt', 'r') as fp:
        for a in soup.find_all('a', href=True, class_='css-1m051bw'):
            if a.text:
                print(a)
                href = a['href']
                if href.startswith('/biz/'):
                    fp.write("https://www.yelp.com{}\n".format(href))
                    print("https://www.yelp.com" + href)


def get_review_by_url(url, id, absa, N = 10):
    reviews = []
    cur_page = 0
    while len(reviews) < N and cur_page <= N/10 + 1:
        review_url = '{}?start={}'.format(url, cur_page * 10)
        print('searching {}'.format(review_url))
        response = requests.get(review_url, timeout=5)
        soup = BeautifulSoup(response.content, 'lxml')

        all_reviews = soup.find_all('div', class_=re.compile('.*review__09f24__oHr9V.*'))
        if all_reviews is None or len(all_reviews) == 0:
            break

        for rev in all_reviews:
            rev_rating = rev.find('div', {"aria-label": re.compile('star rating')})["aria-label"].split()[0]
            rev_rating = int(rev_rating)
            user_info = rev.find_all('div', class_='user-passport-info')[0]
            user_name = user_info.find_all('a', class_='css-1m051bw')[0].text
            user_loc = user_info.find_all('span', class_='css-qgunke')[0].text

            rev_span = rev.find('p', class_='comment__09f24__gu0rG css-qgunke').find('span', class_='raw__09f24__T4Ezm')
            rev_txt = rev_span.text

            rev_lang = rev_span['lang']

            rev_date = rev.find('span', {'class': 'css-chan6m'}).text
            date = time.strptime(rev_date, '%m/%d/%Y')
            rev_date = time.strftime('%Y-%m-%dT%H:%M:%S.0Z', date)
            data = {
                'user_name': user_name,
                'user_loc': user_loc,
                'rating': rev_rating,
                'date': rev_date,
                'review_txt': rev_txt,
                'restaurant': id,
                'review_lang': rev_lang
            }

            quads = absa.predict(rev_txt)['Quadruples']
            sentiments = []
            tag = []
            for i in quads:
                if 'FOOD' in i['category'] or 'DRINKS' in i['category'] and 'NULL' not in i['aspect']:
                    tag.append(i['aspect'].lower())
                if 'SERVICE' in i['category']:
                    tag.append('service')
                if 'AMBIENCE' in i['category']:
                    tag.append('ambience')
                sentiments.append('{}|{}|{}'.format(i['aspect'], i['polarity'], i['category']))

            sentiments = [i for i in sentiments if 'NULL' not in i]
            data['sentiment'] = list(set(sentiments))
            tag = ['food' if x in ['dishes', 'dish'] else x for x in tag]
            data['tag'] = list(set(tag))
            pprint(data)

            reviews.append(data)
            if len(reviews) >= N:
                return reviews
        cur_page += 1
    return reviews


def get_restaurant_info(store_url, id):
    print('get restaurant information at {}'.format(store_url))
    name_en = ""
    name_fr = ""
    name_jp = ""

    response = requests.get(store_url)
    soup = BeautifulSoup(response.content, 'lxml')
    header_content = soup.find_all('div', {'class': re.compile('photo-header-content__.*')})
    raw_name = soup.find_all('h1', class_='css-1se8maq')[0].text
    lang = detect(raw_name)
    if lang == 'jp':
        name_jp = raw_name
    elif lang == 'fr':
        name_fr = raw_name
    else:
        name_en = raw_name
    span_name_en = soup.find_all('h1', class_='css-1fdy0l5')
    if len(span_name_en) > 0:
        name_en = span_name_en[0].text
    raw_category = []
    for text in header_content:
        tags = text.find_all('a', href=re.compile('.*find_desc.*'), recursive=True)
        for tag in tags:
            raw_category.append(tag.text)
    raw_address = ''
    try:
        address = soup.find('address').find_all('span', {'class': 'raw__09f24__T4Ezm'}, recursive=True)
        for addr in address:
            raw_address += addr.text + ' '
    except:
        print('no address found for{}'.format(store_url))
    raw_rating = soup.find('div', {'aria-label': re.compile(' star rating')}, recursive=True)['aria-label']
    raw_rating = raw_rating.replace(' star rating', '')

    map_url = soup.find('img', {'src': re.compile('https://maps.googleapis.com/maps/api.*')}, recursive = True)['src']
    lat_lon = re.findall("\.png%7C(.*)%2C(.*)&signature=", map_url)[0]
    address_latlon = '{},{}'.format(lat_lon[0], lat_lon[1])
    print(lat_lon)
    data = {
        'address': raw_address,
        'rating': raw_rating,
        'category': raw_category,
        "address_latlon": address_latlon,
        'id': id
    }
    if len(name_en) > 0:
        data['name_en'] = name_en
    if len(name_fr) > 0:
        data['name_en'] = name_fr
    if len(name_jp) > 0:
        data['name_en'] = name_jp
    # with open('restaurant_info.json', 'a') as fp:
    #     fp.write('{}\n'.format(json.dumps(data)))
    pprint(data)
    return data


def get_restaurant_url(loc, num_restaurants=5):

    url = 'https://www.yelp.com/search?cflt=restaurants&find_loc={}&sortby=review_count'.format(loc)
    print('search for {}, url={}'.format(loc, url))
    response = requests.get(url, timeout=5)
    soup = BeautifulSoup(response.content, 'lxml')
    res = []
    with open('links_{}.txt'.format(loc), 'w') as fp:
        for a in soup.find_all('a', href=True, class_='css-1m051bw'):
            if a.text:
                href = a['href']
                if href.startswith('/biz/'):
                    fp.write('https://www.yelp.com{}\n'.format(href))
                    res.append("https://www.yelp.com" + href)
                    if len(res) >= num_restaurants:
                        print(res)
                        return res
    print(res)
    return res

# def crawl_by_url(skip_lines, id, loc):
#     with open('links_{}.txt'.format(loc), 'r') as fp:
#         skip = 0
#         for link in fp:
#             link = link.strip()
#             if skip < skip_lines:
#                 skip += 1
#                 continue
#             get_restaurant_info(link, id)
#             get_restaurant_review(link, id)
#             id += 1

def crawl_by_location(loc, absa, num_restaurant=1, num_reviews_per_store = 10):
    urls = get_restaurant_url(loc, num_restaurant)
    I = []
    R = []
    for url in urls:
        restaurant_id = time.time_ns()
        info = get_restaurant_info(url, restaurant_id)
        reviews = get_review_by_url(url, restaurant_id, absa, num_reviews_per_store)
        I.append(info)
        R = R+reviews
    return I, R



def crawl_by_url(url, absa, num_reviews = 10):
    id = time.time_ns()
    info = get_restaurant_info(url, id)
    reviews = get_review_by_url(url, id, absa, num_reviews)
    return info, reviews


# def to_csv():
#     with open('review_texts.csv', 'w', encoding='utf8') as fp,\
#         open('restaurant_reviews.json', 'r') as f_in,\
#         open('restaurant_reviews.csv', 'w', encoding='utf8') as c_out:
#         fp_writer = csv.writer(fp)
#         c_writer = csv.writer(c_out)
#         for line in f_in:
#             data = json.loads(line)
#             fp_writer.writerow([data['review_txt']])
#             vals = list(data.values())
#             c_writer.writerow(vals)

# def info_to_csv():
#     with open('restaurant_info.json', 'r') as f_in,\
#         open('restaurant_info.csv', 'w', encoding='utf8') as c_out:
#         c_writer = csv.writer(c_out)
#         for line in f_in:
#             data = json.loads(line)
#             vals = list(data.values())
#             c_writer.writerow(vals)

# def correct_date():
#     df = pd.read_csv('data/restaurant_reviews.csv')
#     with open('reviews.json', 'r') as fp,\
#         open('reviews.json', 'w', encoding='utf-8') as fp_out:
#         fp_out.write('[')
#         for line in fp:
#             line = line.strip()
#             if line[0]== '[':
#                 line = line[1:]
#             if line[len(line)-1] == ',':
#                 line = line[:len(line)-1]
#
#             data = json.loads(line)
#             name = data['user_name']
#             loc = data['user_loc']
#             sentiments = [x for x in data['sentiment'] if 'NULL' not in x]
#             new_tags = []
#             for s in sentiments:
#                 [term, polarity, category] = s.split('|')
#                 if 'FOOD' in category or 'DRINKS' in category and term not in ['staff']:
#                     new_tags.append(term.lower())
#                 if 'SERVICE' in category:
#                     new_tags.append('service')
#                 if 'AMBIENCE' in category:
#                     new_tags.append('ambience')
#
#             data['sentiment'] = list(set(sentiments))
#             new_tags = ['food' if x in ['dishes','dish'] else x for x in new_tags]
#             data['tag'] = list(set(new_tags))
#             d = df[(df['user_name'] == name)& (df['user_origin'] == loc)]['review_date'].values
#             if len(d) > 0:
#                 d = d[0]
#                 date = time.strptime(d,'%m/%d/%Y')
#                 data['review_date']= time.strftime('%Y-%m-%dT%H:%M:%S.0Z', date)
#             else:
#                 print('did not find line, {}', data['review_txt'][:100])
#             print(sentiments, new_tags)
#             fp_out.write('{}\n'.format(json.dumps(data)))
#         fp_out.write(']')

def crawl(absa, solr, location="",url="",num_reviews = 1, num_restaurants = 1):
    I = []
    R = []
    if len(location) > 0:
        I, R = crawl_by_location(location, absa, num_restaurants, num_reviews)
    elif len(url) > 0:
        I, R = crawl_by_url(url, absa, num_reviews)
        I = [I]
    pprint(I)
    pprint(R)
    #solr.update_restaurant(I)
    #solr.update_review(R)
    return len(I), len(R)



#if __name__ == '__main__':
    #absa = absa_instruction.ABSAGenerator("multilingual")
    #solr = SolrClient()
    #crawl_by_location('Seattle', absa)
    #crawl(absa, solr, url="https://www.yelp.com/biz/pike-place-chowder-seattle")
    # to_csv()
    # info_to_csv()
    # crawl_by_url(5, 105, 'San+Francisco')
    # parse_url('https://www.yelp.com/search?cflt=restaurants&find_loc=Singapore&sortby=review_count')
    # links = ['https://www.yelp.com/biz/toro-boston-2',
    #          'https://www.yelp.com/biz/modern-pastry-shop-boston']
    # id = 38
    # for link in links:
    #     get_restaurant_info(link, id)
    #     get_restaurant_review(link, id)
    #     id += 1
    # link = 'https://www.yelp.com/biz/san-tung-san-francisco-2'
    # get_restaurant_review(link, 104, start_from = 8)
    # pass
    # correct_date()